<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CourierRequest extends FormRequest
{
    public function authorize()
    {
        // You can add additional authorization logic here
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500', // Optional address
        ];
    }
}

