<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PersonalRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Adjust this according to your authorization logic
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $this->id,
            'role' => 'required|in:general,waiter',
            'permissions' => 'nullable|array', // Only required for 'general' role
            'permissions.*' => 'string|exists:permissions,name', // Ensure the permissions exist
            'password' => 'required|string|min:8|confirmed', // Add password validation rules
        ];
    }
}

