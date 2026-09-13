<?php

namespace App\Services;

use App\Models\SystemBackup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class BackupService
{
    public function directory(): string
    {
        $dir = rtrim((string) config('smartcafe.backup.path'), DIRECTORY_SEPARATOR);
        if (!is_dir($dir)) {
            File::makeDirectory($dir, 0750, true);
        }
        return $dir;
    }

    public function nextScheduledAt(): string
    {
        $next = now()->copy()->setTime(3, 0, 0);
        if ($next->lte(now())) {
            $next->addDay();
        }
        return $next->toIso8601String();
    }

    public function run(string $type = 'auto', ?int $userId = null, ?string $label = null): SystemBackup
    {
        $stamp = now()->format('Y-m-d_H-i-s');
        $label = $this->normalizeLabel($label);
        $fileBase = $label
            ? $this->slugLabel($label).'_'.$stamp
            : 'smartcafe_'.$stamp;
        $name = $fileBase.'.zip';
        $backup = SystemBackup::create([
            'name' => $name,
            'label' => $label,
            'status' => 'running',
            'type' => $type,
            'created_by' => $userId,
        ]);

        $work = $this->directory().DIRECTORY_SEPARATOR.'tmp_'.$stamp;
        File::makeDirectory($work, 0750, true);

        try {
            $this->dumpDatabase($work.DIRECTORY_SEPARATOR.'database.sql');
            $this->copyUploads($work);
            $this->copySafeConfig($work);

            $archive = $this->archive($work, $this->directory().DIRECTORY_SEPARATOR.$name);
            $name = basename($archive);
            $size = is_file($archive) ? filesize($archive) : 0;
            $backup->update([
                'name' => $name,
                'path' => $archive,
                'size_bytes' => $size,
                'status' => 'success',
                'finished_at' => now(),
                'error' => null,
            ]);

            $this->prune();

            $tg = app(TelegramNotifier::class)->backupSuccess([
                'name' => $label ?: $name,
                'file' => $name,
                'date' => now()->toDateString(),
                'time' => now()->format('H:i:s'),
                'size' => $this->humanSize($size),
                'location' => $archive,
                'path' => $archive,
            ]);

            $fresh = $backup->fresh();
            $fresh->telegram_zip_sent = (bool) ($tg['ok'] ?? false);
            $fresh->telegram_error = $tg['error'] ?? null;
            $fresh->telegram_parts = $tg['parts'] ?? 0;

            return $fresh;
        } catch (\Throwable $e) {
            Log::error('Backup failed', ['error' => $e->getMessage()]);
            $backup->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
                'finished_at' => now(),
            ]);
            app(TelegramNotifier::class)->backupFailed([
                'reason' => $e->getMessage(),
                'date' => now()->toDateString(),
                'time' => now()->format('H:i:s'),
            ]);
            return $backup->fresh();
        } finally {
            if (is_dir($work)) {
                File::deleteDirectory($work);
            }
        }
    }

    public function deleteBackup(SystemBackup $backup): void
    {
        if ($backup->path && is_file($backup->path) && $this->isInsideBackupDir($backup->path)) {
            @unlink($backup->path);
        }
        $backup->delete();
    }

    public function restore(SystemBackup $backup): void
    {
        if ($backup->status !== 'success' || !$backup->path || !is_file($backup->path) || !$this->isInsideBackupDir($backup->path)) {
            throw new \RuntimeException('Backup faylı tapılmadı.');
        }

        @set_time_limit(0);
        $lock = $this->directory().DIRECTORY_SEPARATOR.'.restore.lock';
        if (is_file($lock) && filemtime($lock) > time() - 3600) {
            throw new \RuntimeException('Başqa bərpa prosesi gedir. Bir az sonra yenidən cəhd edin.');
        }
        File::put($lock, (string) time());

        $stamp = now()->format('Y-m-d_H-i-s');
        $work = $this->directory().DIRECTORY_SEPARATOR.'restore_'.$stamp;
        File::makeDirectory($work, 0750, true);

        try {
            $this->extractZip($backup->path, $work);
            $sql = $this->findSqlDump($work);
            if (!$sql) {
                throw new \RuntimeException('ZIP içində database.sql tapılmadı.');
            }

            $catalog = DB::table('system_backups')->orderBy('id')->get()->map(fn ($row) => (array) $row)->all();

            $this->importDatabase($sql);
            $this->restoreUploads($work);
            $this->restoreBackupCatalog($catalog);
        } finally {
            if (is_dir($work)) {
                File::deleteDirectory($work);
            }
            @unlink($lock);
        }
    }

    public function isInsideBackupDir(string $path): bool
    {
        $real = realpath($path);
        $dir = realpath($this->directory());
        if (!$real || !$dir) {
            return false;
        }
        return str_starts_with($real, $dir);
    }

    private function dumpDatabase(string $target): void
    {
        $connection = config('database.default');
        $cfg = config('database.connections.'.$connection);

        if (($cfg['driver'] ?? '') === 'sqlite') {
            $db = $cfg['database'] ?? database_path('database.sqlite');
            if (is_file($db)) {
                copy($db, $target.'.sqlite');
            }
            File::put($target, "-- sqlite copy created\n");
            return;
        }

        if (($cfg['driver'] ?? '') !== 'mysql') {
            throw new \RuntimeException('Unsupported database driver for backup: '.($cfg['driver'] ?? 'none'));
        }

        $mysqldump = $this->bin('mysqldump');
        $args = [
            $mysqldump,
            '-h', $cfg['host'] ?? '127.0.0.1',
            '-P', (string) ($cfg['port'] ?? 3306),
            '-u', $cfg['username'] ?? 'root',
            '--single-transaction',
            '--quick',
            '--routines',
            $cfg['database'],
        ];

        $process = new Process($args, null, [
            'MYSQL_PWD' => (string) ($cfg['password'] ?? ''),
        ], null, 600);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \RuntimeException('mysqldump failed: '.$process->getErrorOutput());
        }

        File::put($target, $process->getOutput());
    }

    private function copyUploads(string $work): void
    {
        if (!config('smartcafe.backup.include_uploads')) {
            return;
        }
        $public = storage_path('app/public');
        if (is_dir($public)) {
            File::copyDirectory($public, $work.DIRECTORY_SEPARATOR.'uploads');
        }
    }

    private function copySafeConfig(string $work): void
    {
        $dest = $work.DIRECTORY_SEPARATOR.'config';
        File::makeDirectory($dest, 0750, true);
        foreach (['composer.json', 'composer.lock'] as $file) {
            $src = base_path($file);
            if (is_file($src)) {
                copy($src, $dest.DIRECTORY_SEPARATOR.$file);
            }
        }
        File::put($dest.DIRECTORY_SEPARATOR.'app.json', json_encode([
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'app_url' => config('app.url'),
            'backed_up_at' => now()->toIso8601String(),
        ], JSON_PRETTY_PRINT));
    }

    private function archive(string $work, string $archive): string
    {
        if (!class_exists(\ZipArchive::class) || !extension_loaded('zip')) {
            throw new \RuntimeException('PHP zip extension yoxdur — ZIP backup alına bilməz.');
        }

        $zipName = $archive;
        if (!str_ends_with(strtolower($zipName), '.zip')) {
            $zipName = preg_replace('/\.(tar\.gz|tgz)$/i', '.zip', $zipName) ?: $zipName.'.zip';
            if (!str_ends_with(strtolower($zipName), '.zip')) {
                $zipName .= '.zip';
            }
        }

        $zip = new \ZipArchive();
        $opened = $zip->open($zipName, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        if ($opened !== true) {
            throw new \RuntimeException('ZIP açıla bilmədi (kod: '.$opened.').');
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($work, \FilesystemIterator::SKIP_DOTS)
        );
        $count = 0;
        foreach ($files as $file) {
            if (!$file->isFile()) {
                continue;
            }
            $local = ltrim(str_replace($work, '', $file->getPathname()), DIRECTORY_SEPARATOR);
            $local = str_replace('\\', '/', $local);
            if ($zip->addFile($file->getPathname(), $local)) {
                if (method_exists($zip, 'setCompressionName')) {
                    $zip->setCompressionName($local, \ZipArchive::CM_DEFLATE);
                }
                $count++;
            }
        }
        $zip->close();

        if ($count === 0 || !is_file($zipName) || filesize($zipName) < 22) {
            throw new \RuntimeException('ZIP yaradılmadı.');
        }

        return $zipName;
    }

    private function prune(): void
    {
        $keepDays = (int) config('smartcafe.backup.keep_days', 14);
        SystemBackup::query()
            ->where('type', 'auto')
            ->where('created_at', '<', now()->subDays($keepDays))
            ->orderBy('id')
            ->get()
            ->each(function (SystemBackup $row) {
                $this->deleteBackup($row);
            });
    }

    private function bin(string $name): string
    {
        $which = new Process([PHP_OS_FAMILY === 'Windows' ? 'where' : 'which', $name]);
        $which->run();
        $path = trim($which->getOutput());
        $first = preg_split('/\r\n|\r|\n/', $path)[0] ?? '';
        return $first !== '' ? $first : $name;
    }

    public function humanSize(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        $units = ['KB', 'MB', 'GB'];
        $i = -1;
        do {
            $bytes /= 1024;
            $i++;
        } while ($bytes >= 1024 && $i < count($units) - 1);
        return round($bytes, 2).' '.$units[$i];
    }

    private function normalizeLabel(?string $label): ?string
    {
        $label = trim((string) $label);
        if ($label === '') {
            return null;
        }

        return mb_substr($label, 0, 80);
    }

    private function slugLabel(string $label): string
    {
        $slug = Str::slug($label);
        return $slug !== '' ? $slug : 'versiya';
    }

    private function extractZip(string $archive, string $dest): void
    {
        $zip = new \ZipArchive();
        if ($zip->open($archive) !== true) {
            throw new \RuntimeException('ZIP açıla bilmədi.');
        }
        $zip->extractTo($dest);
        $zip->close();
    }

    private function findSqlDump(string $work): ?string
    {
        $direct = $work.DIRECTORY_SEPARATOR.'database.sql';
        if (is_file($direct)) {
            return $direct;
        }
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($work, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($files as $file) {
            if ($file->isFile() && strtolower($file->getExtension()) === 'sql') {
                return $file->getPathname();
            }
        }
        return null;
    }

    private function importDatabase(string $sqlFile): void
    {
        $connection = config('database.default');
        $cfg = config('database.connections.'.$connection);

        if (($cfg['driver'] ?? '') === 'sqlite') {
            $db = $cfg['database'] ?? database_path('database.sqlite');
            $copy = $sqlFile.'.sqlite';
            if (is_file($copy)) {
                copy($copy, $db);
            }
            return;
        }

        if (($cfg['driver'] ?? '') !== 'mysql') {
            throw new \RuntimeException('Bu verilənlər bazası bərpa edilə bilməz.');
        }

        $mysql = $this->bin('mysql');
        $args = [
            $mysql,
            '-h', $cfg['host'] ?? '127.0.0.1',
            '-P', (string) ($cfg['port'] ?? 3306),
            '-u', $cfg['username'] ?? 'root',
            $cfg['database'],
        ];

        $handle = fopen($sqlFile, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('SQL faylı oxunmadı.');
        }

        $process = new Process($args, null, [
            'MYSQL_PWD' => (string) ($cfg['password'] ?? ''),
        ], null, 1800);
        $process->setInput($handle);
        $process->run();
        fclose($handle);

        if (!$process->isSuccessful()) {
            throw new \RuntimeException('Verilənlər bazası bərpa olunmadı: '.$process->getErrorOutput());
        }
    }

    private function restoreUploads(string $work): void
    {
        if (!config('smartcafe.backup.include_uploads')) {
            return;
        }
        $src = $work.DIRECTORY_SEPARATOR.'uploads';
        if (!is_dir($src)) {
            return;
        }
        $dest = storage_path('app/public');
        if (is_dir($dest)) {
            File::deleteDirectory($dest);
        }
        File::copyDirectory($src, $dest);
    }

    private function restoreBackupCatalog(array $catalog): void
    {
        if ($catalog === []) {
            return;
        }
        try {
            DB::table('system_backups')->delete();
            foreach ($catalog as $row) {
                DB::table('system_backups')->insert($row);
            }
        } catch (\Throwable $e) {
            Log::warning('Backup catalog restore skipped', ['error' => $e->getMessage()]);
        }
    }
}
