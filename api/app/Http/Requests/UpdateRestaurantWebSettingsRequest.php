<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRestaurantWebSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $restaurantId = $this->user()->restaurant_id;
        $settingId = optional($this->user()->restaurant?->webSetting)->id;

        return [
            'slug' => [
                'sometimes',
                'string',
                'max:80',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('restaurant_web_settings', 'slug')->ignore($settingId),
            ],
            'custom_domain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i',
                Rule::unique('restaurant_web_settings', 'custom_domain')->ignore($settingId),
            ],
            'is_active' => 'sometimes|boolean',
            'accept_orders' => 'sometimes|boolean',
            'web_title' => 'nullable|string|max:255',
            'web_subtitle' => 'nullable|string|max:500',
            'theme_color' => 'nullable|string|max:20',
            'bg_color' => 'nullable|string|max:20',
            'theme_template' => 'sometimes|string|in:classic,flame,modern',
            'instagram_url' => 'nullable|string|max:500',
            'whatsapp' => 'nullable|string|max:30',
            'website_url' => 'nullable|string|max:500',
            'location_url' => 'nullable|string|max:500',
            'tiktok_url' => 'nullable|string|max:500',
            'domain_note' => 'nullable|string|max:2000',
            'min_order_amount' => 'nullable|numeric|min:0',
        ];
    }
}
