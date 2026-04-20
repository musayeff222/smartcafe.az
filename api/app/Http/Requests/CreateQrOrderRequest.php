<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CreateQrOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */

    public function rules(): array
    {
        return [
            'stocks' => 'nullable|array',
            'stocks.*.stock_id' => 'required|exists:stocks,id',
            'stocks.*.quantity' => 'nullable|integer|min:1',
            'stocks.*.detail_id' => 'nullable|exists:stock_details,id',

            'stock_sets' => 'nullable|array',
            'stock_sets.*.stock_set_id' => 'required|exists:stock_sets,id',
            'stock_sets.*.quantity' => 'nullable|integer|min:1',
        ];
    }


}

