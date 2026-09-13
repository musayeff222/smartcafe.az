<?php

namespace App\Http\Middleware;

use App\Models\RestaurantWebSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WebMenuCors
{
    private const STATIC_ORIGINS = [
        'https://login.smartcafe.az',
        'http://login.smartcafe.az',
        'https://www.login.smartcafe.az',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->isWebMenuRequest($request)) {
            return $next($request);
        }

        // HandleCors runs globally and blocks unknown origins on OPTIONS before
        // route middleware — answer web-menu preflight here first.
        if ($request->getMethod() === 'OPTIONS') {
            return $this->applyHeaders(response('', 204), $request);
        }

        return $this->applyHeaders($next($request), $request);
    }

    private function isWebMenuRequest(Request $request): bool
    {
        $path = ltrim($request->path(), '/');

        return str_starts_with($path, 'api/web-menu');
    }

    private function applyHeaders(Response $response, Request $request): Response
    {
        $origin = $request->headers->get('Origin');
        if (! $origin || ! $this->isAllowedOrigin($origin)) {
            return $response;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }

    private function isAllowedOrigin(string $origin): bool
    {
        $origin = rtrim(strtolower(trim($origin)), '/');

        foreach (self::STATIC_ORIGINS as $allowed) {
            if ($origin === strtolower($allowed)) {
                return true;
            }
        }

        $host = parse_url($origin, PHP_URL_HOST);
        if (! $host) {
            return false;
        }

        $host = preg_replace('/^www\./', '', strtolower($host));

        return RestaurantWebSetting::query()
            ->where('domain_status', 'active')
            ->where('is_active', true)
            ->where(function ($q) use ($host) {
                $q->where('custom_domain', $host)
                    ->orWhere('custom_domain', 'www.' . $host);
            })
            ->exists();
    }
}
