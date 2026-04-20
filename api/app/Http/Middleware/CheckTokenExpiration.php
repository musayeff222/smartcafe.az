<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CheckTokenExpiration
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $token = $user->currentAccessToken();
            $expiresAt = Carbon::parse($token->abilities['expires_at'] ?? null);

            if ($expiresAt->isPast()) {
                $token->delete();
                return response()->json(['message' => 'Token expired, please login again'], 401);
            }
        }

        return $next($request);
    }
}

