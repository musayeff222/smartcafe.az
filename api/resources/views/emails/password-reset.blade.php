<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SmartCafe — Şifrə sıfırlama</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#4f46e5,#9333ea);padding:28px 32px;color:#ffffff;">
                            <div style="font-size:22px;font-weight:700;letter-spacing:0.3px;">SmartCafe</div>
                            <div style="font-size:13px;opacity:0.85;margin-top:4px;">Restoran idarəetmə sistemi</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">Şifrənin sıfırlanması</h1>
                            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;">
                                @if(!empty($userName))
                                    Salam <strong>{{ $userName }}</strong>,
                                @else
                                    Salam,
                                @endif
                            </p>
                            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;">
                                SmartCafe hesabınız üçün şifrə sıfırlama sorğusu qəbul etdik.
                                Şifrənizi yeniləmək üçün aşağıdakı düyməyə basın:
                            </p>
                            <p style="text-align:center;margin:28px 0;">
                                <a href="{{ $resetUrl }}"
                                   style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4f46e5,#9333ea);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                                    Şifrəni sıfırla
                                </a>
                            </p>
                            <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#475569;">
                                Yaxud aşağıdakı linki brauzerinizə köçürün:
                            </p>
                            <p style="margin:0 0 20px 0;font-size:12px;line-height:1.5;color:#334155;word-break:break-all;">
                                <a href="{{ $resetUrl }}" style="color:#4f46e5;">{{ $resetUrl }}</a>
                            </p>
                            <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#475569;">
                                Bu link <strong>60 dəqiqə</strong> ərzində etibarlıdır.
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                                Əgər bu sorğunu siz göndərməmisinizsə, bu maili nəzərə almayın — hesabınız təhlükəsizdir.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                            © {{ date('Y') }} SmartCafe · Bu avtomatik mesajdır, cavab yazmayın.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
