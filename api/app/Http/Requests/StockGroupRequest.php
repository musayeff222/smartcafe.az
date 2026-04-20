<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockGroupRequest extends FormRequest
{
    public function authorize()
    {
        // Authorization logic (ensure the user can create/update a stock group)
        return $this->user()->restaurant !== null;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|max:2048', // File validation for the image
            'color' => 'nullable|string|max:7', // Color code (e.g., #ffffff)
            'kitchen_printer_active' => 'required|boolean',
            'bar_printer_active' => 'required|boolean',
            'show_on_qr_menu' => 'required|boolean',
        ];
    }
}
