<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetLinkMail;
use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;

class PasswordResetController extends Controller
{
    private const GENERIC_MESSAGE = 'Əgər bu e-poçt sistemdə mövcuddursa, şifrə sıfırlama linki emailinizə göndərildi.';
    private const RESET_URL_BASE = 'https://smartcafe.az/reset-password';

    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
        ]);

        $email = strtolower(trim($data['email']));

        $throttleOk = RateLimiter::attempt(
            'password-forgot:' . sha1($email),
            3,
            function () use ($email, $request) {
                $this->maybeSendReset($email, $request);
            },
            600
        );

        if (!$throttleOk) {
            return response()->json(['message' => self::GENERIC_MESSAGE], 200);
        }

        return response()->json(['message' => self::GENERIC_MESSAGE], 200);
    }

    private function maybeSendReset(string $email, Request $request): void
    {
        $user = User::where('email', $email)->first();

        if (!$user || !$user->hasRole('admin')) {
            $this->audit($request, $user?->id, 'password.reset.requested', [
                'email' => $email,
                'sent' => false,
                'reason' => $user ? 'not-admin' : 'no-user',
            ]);
            return;
        }

        try {
            $token = Password::broker()->createToken($user);

            $resetUrl = self::RESET_URL_BASE
                . '?token=' . urlencode($token)
                . '&email=' . urlencode($user->email);

            Mail::to($user->email)->send(new PasswordResetLinkMail($resetUrl, $user->name));

            $this->audit($request, $user->id, 'password.reset.requested', [
                'email' => $email,
                'sent' => true,
            ]);
        } catch (\Throwable $e) {
            Log::error('password.reset.mail_failed', [
                'user_id' => $user->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            $this->audit($request, $user->id, 'password.reset.requested', [
                'email' => $email,
                'sent' => false,
                'reason' => 'mail-failed',
                'error' => substr($e->getMessage(), 0, 250),
            ]);
        }
    }

    public function validateToken(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
            'token' => 'required|string',
        ]);

        $user = User::where('email', strtolower(trim($data['email'])))->first();
        if (!$user || !$user->hasRole('admin')) {
            return response()->json(['valid' => false], 200);
        }

        $valid = Password::broker()->tokenExists($user, $data['token']);
        return response()->json(['valid' => $valid], 200);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $data['email'] = strtolower(trim($data['email']));

        $user = User::where('email', $data['email'])->first();
        if (!$user || !$user->hasRole('admin')) {
            return response()->json([
                'message' => 'Bu link etibarsız və ya vaxtı keçib.',
            ], 400);
        }

        $status = Password::broker()->reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $data['password'],
                'token' => $data['token'],
            ],
            function (User $u, string $password) {
                $u->password = Hash::make($password);
                $u->setRememberToken(\Illuminate\Support\Str::random(60));
                $u->save();
                $u->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            $this->audit($request, $user->id, 'password.reset.completed', [
                'email' => $user->email,
            ]);
            return response()->json([
                'message' => 'Şifrəniz uğurla yeniləndi. İndi yeni şifrənizlə daxil ola bilərsiniz.',
            ], 200);
        }

        $this->audit($request, $user->id, 'password.reset.failed', [
            'email' => $user->email,
            'status' => (string) $status,
        ]);

        return response()->json([
            'message' => 'Bu link etibarsız və ya vaxtı keçib.',
        ], 400);
    }

    private function audit(Request $request, $userId, string $action, array $meta = []): void
    {
        try {
            AdminAuditLog::create([
                'user_id' => $userId,
                'action' => $action,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'meta' => $meta ?: null,
            ]);
        } catch (\Throwable $e) {
        }
    }
}
