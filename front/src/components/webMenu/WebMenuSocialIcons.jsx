import React from "react";

import { Instagram, MapPin, Phone, Globe } from "lucide-react";



export const WhatsAppIcon = ({ size = 20, className = "" }) => (

  <svg

    viewBox="0 0 24 24"

    width={size}

    height={size}

    className={className}

    fill="currentColor"

    aria-hidden="true"

  >

    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />

  </svg>

);



export const TikTokIcon = ({ size = 20, className = "" }) => (

  <svg

    viewBox="0 0 24 24"

    width={size}

    height={size}

    className={className}

    fill="currentColor"

    aria-hidden="true"

  >

    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />

  </svg>

);



const linkClass = "p-2.5 rounded-full transition shadow-sm";



function mapsFromAddress(address) {

  if (!address?.trim()) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;

}



function normalizeWa(num) {

  return String(num || "").replace(/\D/g, "");

}



export const WebMenuSocialLinks = ({ settings = {}, restaurant = {}, variant = "default" }) => {

  const locationUrl = settings.location_url || mapsFromAddress(restaurant.address);

  const waNum = normalizeWa(settings.whatsapp) || normalizeWa(restaurant.phone);

  const telRaw = restaurant.phone?.trim();

  const telHref = telRaw ? `tel:${telRaw.replace(/\s/g, "")}` : null;

  const website = settings.website_url?.trim();



  const hasAny = locationUrl || settings.instagram_url || waNum || settings.tiktok_url || telHref || website;



  if (!hasAny) return null;



  const isDark = variant === "dark";

  const base = isDark

    ? `${linkClass} bg-white/10 backdrop-blur hover:bg-white/20`

    : `${linkClass} bg-white hover:shadow-md border border-slate-100`;



  return (

    <div className="flex justify-center flex-wrap gap-2.5">

      {locationUrl && (

        <a

          href={locationUrl}

          target="_blank"

          rel="noopener noreferrer"

          title="Konum"

          className={`${base} ${isDark ? "text-red-400" : "text-red-600"}`}

        >

          <MapPin size={18} />

        </a>

      )}

      {telHref && (

        <a

          href={telHref}

          title="Zəng"

          className={`${base} ${isDark ? "text-blue-300" : "text-blue-600"}`}

        >

          <Phone size={18} />

        </a>

      )}

      {settings.instagram_url && (

        <a

          href={settings.instagram_url}

          target="_blank"

          rel="noopener noreferrer"

          title="Instagram"

          className={`${base} ${isDark ? "text-pink-400" : "text-pink-600"}`}

        >

          <Instagram size={18} />

        </a>

      )}

      {waNum && (

        <a

          href={`https://wa.me/${waNum}`}

          target="_blank"

          rel="noopener noreferrer"

          title="WhatsApp"

          className={`${base} text-[#25D366]`}

        >

          <WhatsAppIcon size={18} />

        </a>

      )}

      {settings.tiktok_url && (

        <a

          href={settings.tiktok_url}

          target="_blank"

          rel="noopener noreferrer"

          title="TikTok"

          className={`${base} ${isDark ? "text-white" : "text-slate-900"}`}

        >

          <TikTokIcon size={18} />

        </a>

      )}

      {website && (

        <a

          href={website.startsWith("http") ? website : `https://${website}`}

          target="_blank"

          rel="noopener noreferrer"

          title="Vebsayt"

          className={`${base} ${isDark ? "text-indigo-300" : "text-indigo-600"}`}

        >

          <Globe size={18} />

        </a>

      )}

    </div>

  );

}

