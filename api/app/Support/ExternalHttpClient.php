<?php

namespace App\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class ExternalHttpClient
{
    /**
     * SSL verify: CA bundle path, true, or false (local fallback).
     */
    public static function sslVerify(): bool|string
    {
        $env = env('HTTP_VERIFY_SSL');
        if ($env !== null && $env !== '') {
            return filter_var($env, FILTER_VALIDATE_BOOLEAN);
        }

        foreach ([ini_get('curl.cainfo'), ini_get('openssl.cafile')] as $path) {
            if (is_string($path) && $path !== '' && is_file($path)) {
                return $path;
            }
        }

        $bundles = [
            base_path('vendor/composer/ca-bundle/ca-bundle.crt'),
            storage_path('app/cacert.pem'),
        ];

        foreach ($bundles as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        // Windows lokal PHP tez-tez CA bundle olmadan gəlir
        if (app()->environment('local')) {
            return false;
        }

        return true;
    }

    public static function make(array $headers = [], int $timeout = 25): PendingRequest
    {
        return Http::withHeaders($headers)
            ->timeout($timeout)
            ->withOptions(['verify' => self::sslVerify()]);
    }
}
