<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('cost_price') && $this->input('cost_price') === '') {
            $this->merge(['cost_price' => null]);
        }
    }

    public function authorize()
    {
        // Add additional authorization logic if necessary
        return true;
    }

    public function rules()
    {
        return [
            'stock_group_id' => 'nullable|exists:stock_groups,id', // Group can be null
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|max:2048', // Optional image with a size limit
            'show_on_qr' => 'required|boolean',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'amount' => 'required|integer',
            'critical_amount' => 'required|integer|min:0',
            'alert_critical' => 'required|boolean',
            'order_start' => 'nullable|date_format:H:i',
            'order_stop' => 'nullable|date_format:H:i',
            'description'=>'nullable',

            'child_stocks' => 'nullable|array',
            'child_stocks.*.id' => 'required_with:child_stocks|exists:stocks,id',
            'child_stocks.*.quantity' => 'required_with:child_stocks|integer|min:1',

            'additionalPrices' => 'nullable|array',
            'additionalPrices.*.id' => 'nullable|integer',
            'additionalPrices.*.price' => 'required_with:additionalPrices|numeric|min:0',
            'additionalPrices.*.unit' => 'required_with:additionalPrices|string|max:255',
            'additionalPrices.*.count' => 'required_with:additionalPrices|integer|min:1',
        ];
    }
}

