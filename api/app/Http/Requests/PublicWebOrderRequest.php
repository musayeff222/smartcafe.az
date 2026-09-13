<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class PublicWebOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'address' => 'nullable|string|max:500',
            'note' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'stocks' => 'required|array|min:1',
            'stocks.*.stock_id' => 'required|integer',
            'stocks.*.quantity' => 'required|integer|min:1',
            'stocks.*.detail_id' => 'nullable|integer',
            'promo_code' => 'nullable|string|max:64',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $hasAddress = trim((string) $this->input('address', '')) !== '';
            $hasLocation = $this->filled('latitude') && $this->filled('longitude');
            if (!$hasAddress && !$hasLocation) {
                $v->errors()->add('address', 'Ünvan və ya konum tələb olunur.');
            }
        });
    }
}
