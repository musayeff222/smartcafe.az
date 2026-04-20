<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$middlewares): Response
    {
        
        return response()->json([
            'message' => 'This is an OR middleware',
            "middlewares" => $middlewares,
            "response" => $a
        ]);
        return $next($request);
    }
}
