<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingSiteContent extends Model
{
    protected $fillable = ['locale', 'payload'];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public static function defaultPayload(): array
    {
        return [
            'eyebrow' => 'Yeni nəsil restoran proqramı',
            'hero_title' => 'Sifarişdən hesabata — SmartCafe ilə idarəetməni sadələşdirin',
            'hero_lead' => 'SmartCafe bulud əsaslı proqramdır: masa və POS, anbar, kassa axını, heyət və təhlükəsizlik. Canlı panel login.smartcafe.az ünvanındadır.',
            'contact_email' => 'info@smartcafe.az',
            'login_url' => 'https://login.smartcafe.az/',
            'pricing_intro' => 'Qiymət restoran sayı, istifadəçi sayı və modullardan asılıdır. Yazılı kommersiya təklifi təqdim edirik.',
            'faq' => [
                ['q' => 'POS-u smartcafe.az-dan açmaq olarmı?', 'a' => 'Xeyr. Bu ünvan məlumat üçündür. Satış və idarə paneli login.smartcafe.az ünvanındadır.'],
                ['q' => 'Abunəlik necə hesablanır?', 'a' => 'Aylıq və ya illik; dəqiq məbləğ müqavilə ilə təsdiqlənir.'],
            ],
        ];
    }
}
