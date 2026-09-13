<?php

return [
    'project_name' => env('SMARTCAFE_PROJECT_NAME', 'smartcafe.az'),
    'server_name' => env('SMARTCAFE_SERVER_NAME', gethostname() ?: 'smartcafe'),

    'backup' => [
        'path' => env('BACKUP_PATH', storage_path('app/backups')),
        'keep_days' => (int) env('BACKUP_KEEP_DAYS', 14),
        'include_uploads' => filter_var(env('BACKUP_INCLUDE_UPLOADS', true), FILTER_VALIDATE_BOOLEAN),
        'include_env' => false,
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'chat_id' => env('TELEGRAM_CHAT_ID'),
        'enabled' => (bool) env('TELEGRAM_BOT_TOKEN') && (bool) env('TELEGRAM_CHAT_ID'),
        'max_file_mb' => 49,
    ],
];
