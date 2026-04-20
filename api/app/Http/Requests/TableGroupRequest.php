<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TableGroupRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->restaurant_id !== null;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
        ];
    }
}

