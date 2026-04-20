<?php

namespace App\Http\Controllers;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;


class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($validated)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['access_token' => $token, 'token_type' => 'Bearer']);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}


// namespace App\Http\Controllers;

// use Illuminate\Support\Facades\Auth;
// use Illuminate\Http\Request;
// use Carbon\Carbon;

// class AuthController extends Controller
// {
//     public function login(Request $request)
//     {
//         $validated = $request->validate([
//             'email' => 'required|string|email',
//             'password' => 'required|string',
//         ]);

//         if (!Auth::attempt($validated)) {
//             return response()->json(['message' => 'Invalid credentials'], 401);
//         }

//         $user = Auth::user();

//         // Tokenin müddətini təyin edirik
//         $expiration = Carbon::now()->addDay(); // 1 gün sonra
//         $token = $user->createToken('auth_token', ['expires_at' => $expiration])->plainTextToken;

//         return response()->json([
//             'access_token' => $token,
//             'token_type' => 'Bearer',
//             'expires_at' => $expiration,
//         ]);
//     }

//     public function logout(Request $request)
//     {
//         $request->user()->tokens()->delete();

//         return response()->json(['message' => 'Logged out']);
//     }
// }

