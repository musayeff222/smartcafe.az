import React from "react";
import { Clock, Plus, ShoppingBag } from "lucide-react";
import { POWERED_BY_NAME, POWERED_BY_URL } from "../../config/branding";
import { formatRestaurantHours, storageUrl } from "../../utils/storageUrl";
import { formatPrice } from "./themes";
import { WebMenuSocialLinks } from "./WebMenuSocialIcons";

/** Səhifə sonu — SmartCafe linki */
export function WebMenuFooter({ variant = "light" }) {
  const isDark = variant === "dark";
  return (
    <footer className={`mt-8 py-6 px-4 pb-28 text-center ${isDark ? "border-t border-neutral-800" : "border-t border-slate-200/60"}`}>
      <a
        href={POWERED_BY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex flex-col items-center gap-0.5 text-xs transition hover:opacity-80 ${
          isDark ? "text-neutral-500 hover:text-neutral-300" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span>By {POWERED_BY_NAME}</span>
        <span className="text-[10px] opacity-70">smartcafe.az</span>
      </a>
    </footer>
  );
}

/** Banner arxa plan + loqo üstündə */
export function WebMenuHeroHeader({ settings, restaurant, title, theme, variant = "light" }) {
  const bannerUrl = storageUrl(settings.banner_path);
  const logoUrl = storageUrl(restaurant.logo);
  const isDark = variant === "dark";
  const isModern = variant === "modern";
  const hours = formatRestaurantHours(restaurant.open_time, restaurant.close_time);

  const fallbackBg = isDark
    ? `linear-gradient(160deg, ${theme}44 0%, #0d0d0d 70%)`
    : isModern
      ? `linear-gradient(135deg, ${theme}22 0%, #ede9fe 50%, #f0f9ff 100%)`
      : `linear-gradient(135deg, ${theme}30 0%, #f1f5f9 100%)`;

  return (
    <div className="relative mb-2">
      <div
        className={`relative h-36 sm:h-44 w-full overflow-hidden ${isModern ? "rounded-b-3xl" : ""}`}
        style={bannerUrl ? undefined : { background: fallbackBg }}
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        )}
        <div
          className={`absolute inset-0 ${
            bannerUrl
              ? isDark
                ? "bg-gradient-to-b from-black/25 via-black/15 to-black/55"
                : "bg-gradient-to-b from-black/5 via-transparent to-black/25"
              : isDark
                ? "opacity-40"
                : ""
          }`}
          style={!bannerUrl && isDark ? { background: `radial-gradient(ellipse at top, ${theme}55 0%, transparent 70%)` } : undefined}
        />
      </div>

      <div className="relative px-4 -mt-12 sm:-mt-14 pb-2 text-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full object-cover border-4 border-white shadow-xl bg-white"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full border-4 border-white shadow-xl bg-white flex items-center justify-center text-2xl font-bold text-slate-600">
            {(title || restaurant.name || "R").charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className={`text-2xl sm:text-3xl font-bold mt-3 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h1>
        {settings.web_subtitle && (
          <p className={`text-sm mt-1.5 max-w-md mx-auto ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            {settings.web_subtitle}
          </p>
        )}
        {hours && (
          <p
            className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-3 py-1 rounded-full ${
              isDark ? "bg-neutral-800 text-neutral-300" : "bg-white/90 text-slate-600 shadow-sm border border-slate-100"
            }`}
          >
            <Clock size={13} className="shrink-0" />
            <span>Açılış: {hours}</span>
          </p>
        )}
        <div className="mt-3">
          <WebMenuSocialLinks settings={settings} restaurant={restaurant} variant={isDark ? "dark" : "light"} />
        </div>
      </div>
    </div>
  );
}

export const WebMenuClassicLayout = ({
  menuData, settings, restaurant, title, theme, bg,
  selectedCategory, setSelectedCategory, onItemClick, cartCount, cartTotal, onCheckout,
}) => (
  <div className="min-h-screen pb-24" style={{ background: bg }}>
    <WebMenuHeroHeader settings={settings} restaurant={restaurant} title={title} theme={theme} variant="light" />

    <div className="px-3 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 w-max pb-2">
        {(menuData.stockGroups || []).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition"
            style={{
              background: String(selectedCategory) === String(cat.id) ? theme : "#fff",
              color: String(selectedCategory) === String(cat.id) ? "#fff" : "#334155",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>

    <div className="px-4 mt-2 space-y-3">
      {(menuData.stockGroups || []).length === 0 ? (
        <p className="text-center text-slate-500 py-8 text-sm">Menyuda məhsul yoxdur.</p>
      ) : (
        (menuData.stockGroups || [])
          .filter((g) => String(g.id) === String(selectedCategory))
          .flatMap((g) => g.stocks || [])
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick(item)}
              className="w-full flex gap-3 p-3 bg-white rounded-xl shadow-sm text-left hover:shadow-md transition"
            >
              {item.image && (
                <img src={storageUrl(item.image)} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800">{item.name}</div>
                <div className="text-sm font-semibold mt-1" style={{ color: theme }}>{formatPrice(item.price)}</div>
              </div>
              <Plus size={20} className="shrink-0 self-center text-slate-400" />
            </button>
          ))
      )}
    </div>

    <WebMenuFooter variant="light" />

    {cartCount > 0 && (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t shadow-lg">
        <button type="button" onClick={onCheckout} className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-white font-medium" style={{ background: theme }}>
          <span className="flex items-center gap-2"><ShoppingBag size={18} /> Səbət ({cartCount})</span>
          <span>{formatPrice(cartTotal)}</span>
        </button>
      </div>
    )}
  </div>
);

/** Flame Sushi tərzi — qaranlıq fon, qırmızı vurğu, 2 sütunlu grid ([flamesushi.az](https://flamesushi.az/) ilham) */
export const WebMenuFlameLayout = ({
  menuData, settings, restaurant, title, theme, bg,
  selectedCategory, setSelectedCategory, onItemClick, cartCount, cartTotal, onCheckout,
}) => (
  <div className="min-h-screen pb-24 text-white" style={{ background: bg || "#0d0d0d" }}>
    <WebMenuHeroHeader settings={settings} restaurant={restaurant} title={title} theme={theme} variant="dark" />

    <div className="sticky top-0 z-10 px-3 py-3 border-b border-neutral-800 backdrop-blur-md" style={{ background: `${bg || "#0d0d0d"}ee` }}>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide w-max max-w-full mx-auto">
        {(menuData.stockGroups || []).map((cat) => {
          const active = String(selectedCategory) === String(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className="px-4 py-2 text-sm font-semibold whitespace-nowrap transition border-b-2"
              style={{
                color: active ? theme : "#a3a3a3",
                borderColor: active ? theme : "transparent",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>

    <div className="px-3 sm:px-4 mt-4 grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
      {(menuData.stockGroups || []).length === 0 ? (
        <p className="col-span-2 text-center text-neutral-500 py-12 text-sm">Menyuda məhsul yoxdur.</p>
      ) : (
        (menuData.stockGroups || [])
          .filter((g) => String(g.id) === String(selectedCategory))
          .flatMap((g) => g.stocks || [])
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick(item)}
              className="text-left rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 hover:border-neutral-600 transition group"
            >
              <div className="aspect-square bg-neutral-800 relative overflow-hidden">
                {item.image ? (
                  <img src={storageUrl(item.image)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Şəkil yoxdur</div>
                )}
                <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: theme }}>
                  <Plus size={16} />
                </span>
              </div>
              <div className="p-3">
                <div className="font-medium text-sm text-white line-clamp-2 leading-snug">{item.name}</div>
                <div className="text-sm font-bold mt-1.5" style={{ color: theme }}>{formatPrice(item.price)}</div>
              </div>
            </button>
          ))
      )}
    </div>

    <WebMenuFooter variant="dark" />

    {cartCount > 0 && (
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
        <button
          type="button"
          onClick={onCheckout}
          className="w-full max-w-2xl mx-auto flex items-center justify-between py-3.5 px-5 rounded-2xl text-white font-semibold shadow-xl"
          style={{ background: `linear-gradient(135deg, ${theme}, #b91c1c)` }}
        >
          <span className="flex items-center gap-2"><ShoppingBag size={18} /> Sifariş ({cartCount})</span>
          <span>{formatPrice(cartTotal)}</span>
        </button>
      </div>
    )}
  </div>
);

/** Modern — şüşə effektli kartlar, yumşaq gradient */
export const WebMenuModernLayout = ({
  menuData, settings, restaurant, title, theme, bg,
  selectedCategory, setSelectedCategory, onItemClick, cartCount, cartTotal, onCheckout,
}) => (
  <div className="min-h-screen pb-24" style={{ background: "linear-gradient(160deg, #ede9fe 0%, #f0f9ff 45%, #fdf4ff 100%)" }}>
    <WebMenuHeroHeader settings={settings} restaurant={restaurant} title={title} theme={theme} variant="modern" />

    <div className="px-4 max-w-lg mx-auto">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {(menuData.stockGroups || []).map((cat) => {
          const active = String(selectedCategory) === String(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className="px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition shadow-sm"
              style={{
                background: active ? theme : "rgba(255,255,255,0.7)",
                color: active ? "#fff" : "#475569",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>

    <div className="px-4 mt-4 space-y-3 max-w-lg mx-auto">
      {(menuData.stockGroups || []).length === 0 ? (
        <p className="text-center text-slate-500 py-8 text-sm">Menyuda məhsul yoxdur.</p>
      ) : (
        (menuData.stockGroups || [])
          .filter((g) => String(g.id) === String(selectedCategory))
          .flatMap((g) => g.stocks || [])
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick(item)}
              className="w-full flex gap-4 p-3 rounded-2xl text-left backdrop-blur-md bg-white/70 border border-white/90 shadow-md hover:shadow-lg hover:bg-white/90 transition"
            >
              {item.image && (
                <img src={storageUrl(item.image)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm" />
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="font-semibold text-slate-800">{item.name}</div>
                <div className="text-sm font-bold mt-1" style={{ color: theme }}>{formatPrice(item.price)}</div>
              </div>
              <span className="shrink-0 self-center w-9 h-9 rounded-xl flex items-center justify-center text-white shadow" style={{ background: theme }}>
                <Plus size={18} />
              </span>
            </button>
          ))
      )}
    </div>

    <WebMenuFooter variant="light" />

    {cartCount > 0 && (
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <button
          type="button"
          onClick={onCheckout}
          className="w-full max-w-lg mx-auto flex items-center justify-between py-3 px-5 rounded-2xl text-white font-medium shadow-2xl"
          style={{ background: theme }}
        >
          <span className="flex items-center gap-2"><ShoppingBag size={18} /> Səbət ({cartCount})</span>
          <span>{formatPrice(cartTotal)}</span>
        </button>
      </div>
    )}
  </div>
);

/** Admin panelində şablon seçimi üçün mini önizləmə */
export const TemplatePreviewMock = ({ templateId, selected, onClick, label }) => {
  const t = { classic: { bg: "#f8fafc", accent: "#6366f1", card: "#fff" }, flame: { bg: "#0d0d0d", accent: "#e63946", card: "#1a1a1a" }, modern: { bg: "linear-gradient(135deg,#ede9fe,#f0f9ff)", accent: "#7c3aed", card: "rgba(255,255,255,0.8)" } }[templateId] || { bg: "#f8fafc", accent: "#6366f1", card: "#fff" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 transition text-left w-full ${selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div className="h-28 p-2" style={{ background: t.bg }}>
        <div className="h-3 w-8 mx-auto rounded-full mb-2" style={{ background: t.accent, opacity: 0.8 }} />
        <div className="flex gap-1 justify-center mb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-6 rounded-full" style={{ background: i === 1 ? t.accent : t.card, border: "1px solid #ccc" }} />
          ))}
        </div>
        {templateId === "flame" ? (
          <div className="grid grid-cols-2 gap-1 px-1">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-md overflow-hidden" style={{ background: t.card }}>
                <div className="h-6 bg-neutral-700" />
                <div className="h-1.5 m-1 rounded" style={{ background: t.accent, width: "60%" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 px-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 rounded-md flex gap-1 p-0.5" style={{ background: t.card }}>
                <div className="w-4 h-full rounded bg-slate-200 shrink-0" />
                <div className="h-1.5 flex-1 mt-1 rounded" style={{ background: t.accent, width: "40%", opacity: 0.7 }} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`px-2 py-1.5 text-xs font-medium ${selected ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-600"}`}>
        {label}
        {selected && <span className="float-right">✓</span>}
      </div>
    </button>
  );
};
