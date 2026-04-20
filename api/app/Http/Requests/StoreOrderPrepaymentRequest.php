<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderPrepaymentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:cash,bank,customer_balance',  // Validate type
            'date' => 'required|date',
        ];
    }
}

