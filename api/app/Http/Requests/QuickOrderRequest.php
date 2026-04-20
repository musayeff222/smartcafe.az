<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuickOrderRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Adjust based on your authorization logic
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'note' => 'nullable|string|max:1000',
            'courier_id' => 'nullable|exists:couriers,id',  // Ensure courier_id exists in couriers table
            'stocks' => 'nullable|array',
            'stocks.*.stock_id' => 'required|exists:stocks,id',
            'stocks.*.quantity' => 'required|integer|min:1',
        ];
    }
}
