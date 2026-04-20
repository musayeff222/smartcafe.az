<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RestaurantRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|max:2048', // optional, with file size limit
            'language' => 'required|string|max:255',
            'currency' => 'required|string|max:255',
            'custom_message' => 'nullable|string|max:1000',
            'is_qr_active' => 'required|boolean',
            'get_qr_order' => 'required|boolean',
            'main_printer' => 'nullable|string|max:255',
            'kitchen_printer' => 'nullable|string|max:255',
            'bar_printer' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'empty_table_color' => 'nullable|string|max:7', // Assuming hex color codes
            'booked_table_color' => 'nullable|string|max:7',
        ];
    }
}

