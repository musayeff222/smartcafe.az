<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerTransactionRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Adjust as necessary for authorization logic
    }

    public function rules()
    {
        return [
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:credit,debit',
            'note' => 'nullable|string|max:1000',
            'date' => 'required|date', // Add this line
        ];
    }
}

