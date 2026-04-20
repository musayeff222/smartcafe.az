<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TableRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->restaurant_id !== null;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'table_group_id' => 'nullable|exists:table_groups,id', // Ensure group exists if provided
        ];
    }
}

