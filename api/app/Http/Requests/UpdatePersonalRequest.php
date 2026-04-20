<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePersonalRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Adjust this according to your authorization logic
    }

    public function rules()
    {
        $userId = $this->route('personal')->id ?? null;  // Get the user ID from the route

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $userId,
            'role' => 'required|in:general,waiter',
            'permissions' => 'nullable|array', // Only required for 'general' role
            'permissions.*' => 'string|exists:permissions,name', // Ensure the permissions exist
            'password' => 'nullable|string|min:8|confirmed', // Add password validation rules
        ];
    }
}

