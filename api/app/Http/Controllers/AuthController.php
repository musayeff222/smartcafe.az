<?php

namespace App\Http\Controllers;
use App\Models\AdminAuditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
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

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Cari şifrə yanlışdır.'], 403);
        }

        $user->password = $data['password'];
        $user->save();
        $user->tokens()->delete();

        $expiresAt = Carbon::now()->addHours(8);
        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        $this->audit($request, $user->id, 'password.change');

        return response()->json([
            'message' => 'Şifrə yeniləndi.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    public function changeEmail(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'email' => 'required|email|max:190|confirmed|unique:users,email',
        ]);

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Cari şifrə yanlışdır.'], 403);
        }

        if (strcasecmp($user->email, $data['email']) === 0) {
            return response()->json(['message' => 'Yeni e-mail mövcud e-mail ilə eynidir.'], 422);
        }

        $old = $user->email;
        $user->email = $data['email'];
        $user->pending_email = null;
        $user->email_change_token = null;
        $user->email_change_expires_at = null;
        $user->email_verified_at = null;
        $user->save();
        $user->tokens()->delete();

        $expiresAt = Carbon::now()->addHours(8);
        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        $this->audit($request, $user->id, 'email.change', [
            'from' => $old,
            'to' => $user->email,
        ]);

        return response()->json([
            'message' => 'E-mail yeniləndi. Köhnə sessiyalar bağlandı.',
            'email' => $user->email,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
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
        } catch (\Exception $e) {
        }
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

