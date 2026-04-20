<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HasRestaurant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  \Symfony\Component\HttpFoundation\Response  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if the authenticated user has a restaurant associated
        if (!$request->user() || !$request->user()->restaurant || !$request->user()->restaurant->is_active || $request->user()->restaurant->active_until < now()) {
            return response()->json(['message' => 'User does not belong to any  active restaurant.'], 403);
        }
        // if (!$request->user() || !$request->user()->restaurant ) {
        //     return response()->json(['message' => 'User does not belong to any  active restaurant.'], 403);
        // }

        return $next($request);
    }
}
