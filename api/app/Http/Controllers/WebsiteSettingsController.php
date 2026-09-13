<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\WebsiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WebsiteSettingsController extends Controller
{
    public function show()
    {
        return response()->json($this->payload());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'general' => 'sometimes|array',
            'seo' => 'sometimes|array',
            'homepage' => 'sometimes|array',
            'social' => 'sometimes|array',
            'visibility' => 'sometimes|array',
        ]);

        if (isset($data['homepage']['testimonials']) && is_array($data['homepage']['testimonials'])) {
            $data['homepage']['testimonials'] = $this->sanitizeTestimonials($data['homepage']['testimonials']);
        }
        if (isset($data['homepage']['faq']) && is_array($data['homepage']['faq'])) {
            $data['homepage']['faq'] = $this->sanitizeFaq($data['homepage']['faq']);
        }
        if (isset($data['visibility']) && is_array($data['visibility'])) {
            foreach ($data['visibility'] as $key => $value) {
                $data['visibility'][$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
        }

        foreach (['general', 'seo', 'homepage', 'social', 'visibility'] as $group) {
            if (isset($data[$group]) && is_array($data[$group])) {
                WebsiteSetting::putGroup($group, $data[$group]);
            }
        }

        $this->audit($request, 'settings.update');

        return response()->json([
            'message' => 'Parametrlər yadda saxlandı.',
            'data' => $this->payload(),
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,gif,ico|max:5120',
        ]);

        $path = $request->file('file')->store('website', 'public');
        $relative = ltrim(str_replace('\\', '/', $path), '/');

        return response()->json([
            'path' => $relative,
            'url' => Storage::disk('public')->url($relative),
        ]);
    }

    private function payload(): array
    {
        $grouped = WebsiteSetting::grouped();
        $out = [];
        foreach (['general', 'seo', 'homepage', 'social', 'visibility'] as $group) {
            $out[$group] = array_replace($this->defaults($group), $this->flattenGroup($grouped[$group] ?? []));
        }
        return $out;
    }

    private function flattenGroup(array $stored): array
    {
        $flat = [];
        foreach ($stored as $key => $value) {
            $short = str_contains((string) $key, '.')
                ? substr((string) $key, strrpos((string) $key, '.') + 1)
                : $key;
            $flat[$short] = $value;
        }
        return $flat;
    }

    private function sanitizeTestimonials(array $items): array
    {
        $out = [];
        foreach (array_slice(array_values($items), 0, 24) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $out[] = [
                'name' => mb_substr((string) ($item['name'] ?? ''), 0, 80),
                'role' => mb_substr((string) ($item['role'] ?? ''), 0, 80),
                'text' => mb_substr((string) ($item['text'] ?? ''), 0, 800),
                'avatar' => mb_substr((string) ($item['avatar'] ?? ''), 0, 500),
                'visible' => filter_var($item['visible'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];
        }
        return $out;
    }

    private function sanitizeFaq(array $items): array
    {
        $out = [];
        foreach (array_slice(array_values($items), 0, 30) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $q = mb_substr((string) ($item['q'] ?? $item['question'] ?? ''), 0, 200);
            $a = mb_substr((string) ($item['a'] ?? $item['answer'] ?? ''), 0, 2000);
            if ($q === '' && $a === '') {
                continue;
            }
            $out[] = ['q' => $q, 'a' => $a];
        }
        return $out;
    }

    private function defaults(string $group): array
    {
        return match ($group) {
            'general' => [
                'website_name' => 'SmartCafe',
                'logo' => '',
                'favicon' => '',
                'phone' => '',
                'email' => 'support@smartcafe.az',
                'address' => '',
                'whatsapp' => '994556172023',
                'copyright' => '© SmartCafe',
                'status' => 'online',
            ],
            'seo' => [
                'meta_title' => 'SmartCafe — Restoran & Kafe idarəetmə sistemi',
                'meta_description' => '',
                'keywords' => '',
                'og_image' => '',
                'robots' => 'index,follow',
                'sitemap_enabled' => true,
                'google_verification' => '',
                'analytics_id' => '',
                'search_console' => '',
            ],
            'homepage' => [
                'eyebrow' => 'Yeni nəsil restoran idarəetmə sistemi',
                'hero_title' => 'Restoranınızı ağıllı idarə edin',
                'hero_description' => 'SmartCafe — QR menyu, POS, kassa, stok, kuryer və hesabatları tək platformada birləşdirir.',
                'hero_image' => '',
                'hero_button_text' => 'Pulsuz sınayın',
                'hero_button_url' => 'https://login.smartcafe.az/',
                'hero_button2_text' => 'Planları gör',
                'hero_button2_url' => '#plans',
                'testimonials' => [
                    [
                        'name' => 'Rəşad M.',
                        'role' => 'Kafe sahibi, Bakı',
                        'text' => 'Kağız menyudan QR-a keçəndən sonra sifariş sürətimiz ikiqat artdı. Kassa günün sonunda hər şeyi öz-özü hesablayır.',
                        'avatar' => '',
                        'visible' => true,
                    ],
                    [
                        'name' => 'Aygün S.',
                        'role' => 'Restoran meneceri',
                        'text' => 'Anbar və xammal modulu ilə yemək maya dəyərini dəqiq bilirik. Dəstək komandası çox operativdir.',
                        'avatar' => '',
                        'visible' => true,
                    ],
                    [
                        'name' => 'Elvin R.',
                        'role' => 'Şəbəkə kafe sahibi',
                        'text' => '3 filialı bir hesabatda görmək çox rahatdır. SuperAdmin funksiyası mənim üçün oyunun qaydalarını dəyişdi.',
                        'avatar' => '',
                        'visible' => true,
                    ],
                ],
                'faq' => [
                    ['q' => 'SmartCafe hansı biznes növləri üçün uyğundur?', 'a' => 'Restoran, kafe, fast-food, çayxana, bar, kondiche və çatdırılma xidməti göstərən istənilən ictimai iaşə obyekti üçün.'],
                    ['q' => 'Sistemi sınamaq üçün ödəniş etmək lazımdırmı?', 'a' => 'Xeyr. Pulsuz demo hesabı ilə bütün funksiyaları sınaya bilərsiniz. Sonra sizə uyğun paketi seçmək kifayətdir.'],
                    ['q' => 'Verilənlər harada saxlanılır?', 'a' => 'Bütün məlumatlar bulud serverdə şifrələnmiş bağlantı üzərindən qorunur, gündəlik avtomatik yedəkləmə aparılır.'],
                    ['q' => 'Neçə cihaz və istifadəçi qoşula bilər?', 'a' => 'Paketdən asılıdır. İstənilən planda əlavə istifadəçi və POS cihazı əlavə etmək mümkündür.'],
                    ['q' => 'Quraşdırma və köçürmə xidməti varmı?', 'a' => 'Bəli. Komandamız menyunu, məhsulları və köhnə sistemdən verilənləri sizin əvəzinizə köçürür.'],
                    ['q' => 'Dəstək necə təşkil olunub?', 'a' => 'WhatsApp, telefon və e-poçt ilə iş saatları ərzində operativ dəstək; korporativ paketlərdə SLA ilə 24/7.'],
                ],
            ],
            'social' => [
                'facebook' => '',
                'instagram' => '',
                'tiktok' => '',
                'youtube' => '',
                'linkedin' => '',
            ],
            'visibility' => [
                'hero' => true,
                'stats' => true,
                'services' => true,
                'how' => true,
                'plans' => true,
                'testimonials' => true,
                'faq' => true,
                'contact' => true,
                'whatsapp' => true,
                'login_cta' => true,
            ],
            default => [],
        };
    }

    private function audit(Request $request, string $action): void
    {
        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => $action,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
            ]);
        } catch (\Exception $e) {
        }
    }
}
