import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Globe,
  Loader2,
  ImagePlus,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Star,
  HelpCircle,
  Share2,
  Search,
  Home,
  Settings2,
  ExternalLink,
  Save,
  Upload,
  MessageSquareQuote,
} from "lucide-react";
import { adminGet, adminPut, adminUpload, friendlyError } from "./adminApi";
import { mediaUrl, domain_url } from "../../api/index";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { Card, CardHeader } from "./ui/Card";

const TABS = [
  { id: "general", label: "Ümumi", icon: Settings2 },
  { id: "homepage", label: "Ana səhifə", icon: Home },
  { id: "testimonials", label: "Rəylər", icon: MessageSquareQuote },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "visibility", label: "Görünüş", icon: Eye },
  { id: "seo", label: "SEO", icon: Search },
  { id: "social", label: "Sosial", icon: Share2 },
];

const VISIBILITY_ITEMS = [
  { key: "hero", label: "Hero (ana banner)", hint: "Saytın yuxarısındakı başlıq və düymələr" },
  { key: "stats", label: "Statistika zolağı", hint: "Rəqəmlər / göstəricilər" },
  { key: "services", label: "Xidmətlər", hint: "QR, POS, kassa və s." },
  { key: "how", label: "İşləmə qaydası", hint: "4 addımlıq izah" },
  { key: "plans", label: "Planlar / paketlər", hint: "Qiymət kartları" },
  { key: "testimonials", label: "Rəylər", hint: "Müştəri rəyləri bloku" },
  { key: "faq", label: "FAQ", hint: "Tez-tez verilən suallar" },
  { key: "contact", label: "Əlaqə bloku", hint: "Aşağıdakı WhatsApp / e-poçt CTA" },
  { key: "whatsapp", label: "WhatsApp düyməsi", hint: "Sağ altdakı yaşıl düymə" },
  { key: "login_cta", label: "Daxil ol / Pulsuz sınayın", hint: "Header-dəki giriş düymələri" },
];

function Toggle({ on, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-[#1f2a44] bg-white dark:bg-[#111a2e] hover:border-indigo-300 dark:hover:border-indigo-500/40 transition text-left"
    >
      <div className="min-w-0">
        <div className="font-semibold text-slate-800 dark:text-slate-100">{label}</div>
        {hint && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</div>}
      </div>
      <span
        className={`relative shrink-0 w-12 h-7 rounded-full transition ${
          on ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition ${
            on ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}

function ImageField({ label, value, onChange, hint, compact }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const preview = mediaUrl(value);

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Şəkil 5 MB-dan böyük ola bilməz");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const r = await adminUpload("/admin/website-settings/upload", fd);
      onChange(r.data.path || r.data.url || "");
      toast.success("Şəkil yükləndi");
    } catch (e) {
      toast.error(friendlyError(e, "Şəkil yüklənmədi"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </span>
      )}
      <div
        className={`flex ${compact ? "flex-row items-center" : "flex-col sm:flex-row"} gap-3`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            uploadFile(e.dataTransfer.files?.[0]);
          }}
          disabled={busy}
          className={`relative overflow-hidden grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#1f2a44] bg-slate-50 dark:bg-[#0f1830] hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:border-indigo-500/50 transition ${
            compact ? "w-16 h-16 shrink-0" : "w-full sm:w-40 h-32"
          }`}
        >
          {busy ? (
            <Loader2 size={20} className="animate-spin text-indigo-600" />
          ) : preview ? (
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-slate-400">
              <ImagePlus size={compact ? 18 : 22} />
              {!compact && <span className="text-[11px] font-medium">Yüklə / at</span>}
            </span>
          )}
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="və ya şəkil URL-i yapışdırın"
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={Upload} onClick={() => inputRef.current?.click()} loading={busy}>
              Kompüterdən
            </Button>
            {value ? (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onChange("")}>
                Sil
              </Button>
            ) : null}
          </div>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,.ico"
        className="hidden"
        onChange={(e) => {
          uploadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function AdminWebsite() {
  const [tab, setTab] = useState("general");
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    adminGet("/admin/website-settings")
      .then((r) => setData(r.data))
      .catch((e) => toast.error(friendlyError(e, "Ayarlar yüklənmədi")));
  }, []);

  const setGroup = (group, patch) => {
    setDirty(true);
    setData((prev) => ({
      ...prev,
      [group]: { ...(prev?.[group] || {}), ...patch },
    }));
  };

  const setField = (group, key, value) => setGroup(group, { [key]: value });

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminPut("/admin/website-settings", data);
      setData(res.data.data || data);
      setDirty(false);
      toast.success("Sayt ayarları yadda saxlandı");
    } catch (e) {
      toast.error(friendlyError(e, "Saxlanmadı"));
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-16 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] animate-pulse" />
        <div className="h-80 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] animate-pulse" />
      </div>
    );
  }

  const testimonials = Array.isArray(data.homepage?.testimonials) ? data.homepage.testimonials : [];
  const faq = Array.isArray(data.homepage?.faq) ? data.homepage.faq : [];
  const vis = data.visibility || {};

  const updateTestimonial = (idx, patch) => {
    const next = testimonials.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    setField("homepage", "testimonials", next);
  };

  const updateFaq = (idx, patch) => {
    const next = faq.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    setField("homepage", "faq", next);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b1220] flex flex-col">
      <div className="bg-white dark:bg-[#111a2e] border-b border-slate-200 dark:border-[#1f2a44] px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white grid place-items-center shrink-0 shadow-md">
              <Globe size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                Sayt ayarları
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                smartcafe.az — rəylər, şəkillər, düymələr və bölmələr
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={domain_url || "https://smartcafe.az"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#1f2a44] hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ExternalLink size={14} /> Canlı sayt
            </a>
            <Button variant="primary" icon={Save} loading={saving} onClick={save}>
              Yadda saxla
            </Button>
          </div>
        </div>

        <div className="mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                    on
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-5 pb-28">
        {tab === "general" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card className="xl:col-span-7 space-y-4">
              <CardHeader title="Əlaqə və brend" description="Logo, ad və əlaqə məlumatları canlı saytda görünür." />
              <Input
                label="Sayt adı"
                value={data.general?.website_name || ""}
                onChange={(e) => setField("general", "website_name", e.target.value)}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Telefon"
                  value={data.general?.phone || ""}
                  onChange={(e) => setField("general", "phone", e.target.value)}
                  placeholder="+994 ..."
                />
                <Input
                  label="E-mail"
                  value={data.general?.email || ""}
                  onChange={(e) => setField("general", "email", e.target.value)}
                />
              </div>
              <Input
                label="WhatsApp nömrəsi"
                hint="Yalnız rəqəmlər, məs. 994556172023"
                value={data.general?.whatsapp || ""}
                onChange={(e) => setField("general", "whatsapp", e.target.value)}
              />
              <Input
                label="Ünvan"
                value={data.general?.address || ""}
                onChange={(e) => setField("general", "address", e.target.value)}
              />
              <Input
                label="Copyright"
                value={data.general?.copyright || ""}
                onChange={(e) => setField("general", "copyright", e.target.value)}
              />
            </Card>
            <Card className="xl:col-span-5 space-y-5">
              <CardHeader title="Şəkillər" description="PNG, JPG, WEBP — max 5 MB. Sürükləyib atmaq olar." />
              <ImageField
                label="Logo"
                value={data.general?.logo || ""}
                onChange={(v) => setField("general", "logo", v)}
                hint="Header-də görünəcək"
              />
              <ImageField
                label="Favicon"
                value={data.general?.favicon || ""}
                onChange={(v) => setField("general", "favicon", v)}
                hint="Brauzer tab ikonası"
              />
            </Card>
          </div>
        )}

        {tab === "homepage" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card className="xl:col-span-7 space-y-4">
              <CardHeader title="Hero mətni" description="smartcafe.az ana səhifəsinin yuxarı bloku." />
              <Input
                label="Kiçik başlıq (eyebrow)"
                value={data.homepage?.eyebrow || ""}
                onChange={(e) => setField("homepage", "eyebrow", e.target.value)}
              />
              <label className="block text-sm">
                <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Əsas başlıq
                </span>
                <textarea
                  rows={2}
                  value={data.homepage?.hero_title || ""}
                  onChange={(e) => setField("homepage", "hero_title", e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Təsvir
                </span>
                <textarea
                  rows={4}
                  value={data.homepage?.hero_description || ""}
                  onChange={(e) => setField("homepage", "hero_description", e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="1-ci düymə mətni"
                  value={data.homepage?.hero_button_text || ""}
                  onChange={(e) => setField("homepage", "hero_button_text", e.target.value)}
                />
                <Input
                  label="1-ci düymə linki"
                  value={data.homepage?.hero_button_url || ""}
                  onChange={(e) => setField("homepage", "hero_button_url", e.target.value)}
                />
                <Input
                  label="2-ci düymə mətni"
                  value={data.homepage?.hero_button2_text || ""}
                  onChange={(e) => setField("homepage", "hero_button2_text", e.target.value)}
                />
                <Input
                  label="2-ci düymə linki"
                  value={data.homepage?.hero_button2_url || ""}
                  onChange={(e) => setField("homepage", "hero_button2_url", e.target.value)}
                />
              </div>
            </Card>
            <Card className="xl:col-span-5 space-y-4">
              <CardHeader title="Hero şəkli" description="Boş buraxsanız, POS mockup qalır." />
              <ImageField
                label="Banner / mockup əvəzi"
                value={data.homepage?.hero_image || ""}
                onChange={(v) => setField("homepage", "hero_image", v)}
              />
            </Card>
          </div>
        )}

        {tab === "testimonials" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Müştəri rəyləri</h2>
                <p className="text-sm text-slate-500">Bu kartlar smartcafe.az-da tünd blokda görünür.</p>
              </div>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() =>
                  setField("homepage", "testimonials", [
                    ...testimonials,
                    { name: "", role: "", text: "", avatar: "", visible: true },
                  ])
                }
              >
                Rəy əlavə et
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {testimonials.map((item, idx) => (
                <Card key={idx} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <Star key={s} size={12} className="fill-amber-400" />
                      ))}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={item.visible === false ? "Göstər" : "Gizlət"}
                        onClick={() => updateTestimonial(idx, { visible: item.visible === false })}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        {item.visible === false ? (
                          <EyeOff size={16} className="text-slate-400" />
                        ) : (
                          <Eye size={16} className="text-indigo-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Sil"
                        onClick={() =>
                          setField(
                            "homepage",
                            "testimonials",
                            testimonials.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <ImageField
                    compact
                    label="Avatar"
                    value={item.avatar || ""}
                    onChange={(v) => updateTestimonial(idx, { avatar: v })}
                  />
                  <Input
                    label="Ad"
                    value={item.name || ""}
                    onChange={(e) => updateTestimonial(idx, { name: e.target.value })}
                  />
                  <Input
                    label="Vəzifə / şəhər"
                    value={item.role || ""}
                    onChange={(e) => updateTestimonial(idx, { role: e.target.value })}
                  />
                  <label className="block text-sm">
                    <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Rəy
                    </span>
                    <textarea
                      rows={4}
                      value={item.text || ""}
                      onChange={(e) => updateTestimonial(idx, { text: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
                    />
                  </label>
                </Card>
              ))}
            </div>
            {testimonials.length === 0 && (
              <Card className="text-center py-10 text-slate-500">
                Hələ rəy yoxdur. “Rəy əlavə et” ilə başlayın.
              </Card>
            )}
          </div>
        )}

        {tab === "faq" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Tez-tez verilən suallar</h2>
                <p className="text-sm text-slate-500">Sual və cavablar FAQ bölməsində açılır.</p>
              </div>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setField("homepage", "faq", [...faq, { q: "", a: "" }])}
              >
                Sual əlavə et
              </Button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {faq.map((item, idx) => (
                <Card key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "homepage",
                          "faq",
                          faq.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <Input
                    label="Sual"
                    value={item.q || ""}
                    onChange={(e) => updateFaq(idx, { q: e.target.value })}
                  />
                  <label className="block text-sm">
                    <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Cavab
                    </span>
                    <textarea
                      rows={3}
                      value={item.a || ""}
                      onChange={(e) => updateFaq(idx, { a: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
                    />
                  </label>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "visibility" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {VISIBILITY_ITEMS.map((item) => (
              <Toggle
                key={item.key}
                label={item.label}
                hint={item.hint}
                on={vis[item.key] !== false}
                onChange={(v) => setField("visibility", item.key, v)}
              />
            ))}
          </div>
        )}

        {tab === "seo" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card className="xl:col-span-7 space-y-4">
              <CardHeader title="Axtarış motoru" description="Google və sosial paylaşımlar üçün." />
              <Input
                label="Meta title"
                value={data.seo?.meta_title || ""}
                onChange={(e) => setField("seo", "meta_title", e.target.value)}
              />
              <label className="block text-sm">
                <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Meta description
                </span>
                <textarea
                  rows={3}
                  value={data.seo?.meta_description || ""}
                  onChange={(e) => setField("seo", "meta_description", e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
                />
              </label>
              <Input
                label="Keywords"
                value={data.seo?.keywords || ""}
                onChange={(e) => setField("seo", "keywords", e.target.value)}
              />
              <Input
                label="Robots"
                value={data.seo?.robots || ""}
                onChange={(e) => setField("seo", "robots", e.target.value)}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Google verification"
                  value={data.seo?.google_verification || ""}
                  onChange={(e) => setField("seo", "google_verification", e.target.value)}
                />
                <Input
                  label="Analytics ID"
                  value={data.seo?.analytics_id || ""}
                  onChange={(e) => setField("seo", "analytics_id", e.target.value)}
                />
              </div>
            </Card>
            <Card className="xl:col-span-5 space-y-4">
              <CardHeader title="Open Graph şəkli" description="WhatsApp / Facebook paylaşımında görünür." />
              <ImageField
                label="OG image"
                value={data.seo?.og_image || ""}
                onChange={(v) => setField("seo", "og_image", v)}
              />
            </Card>
          </div>
        )}

        {tab === "social" && (
          <Card className="space-y-4">
            <CardHeader title="Sosial şəbəkələr" description="Footer-də link kimi çıxır. Boş olanlar gizlədilir." />
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["youtube", "YouTube"],
                ["linkedin", "LinkedIn"],
              ].map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={data.social?.[key] || ""}
                  onChange={(e) => setField("social", key, e.target.value)}
                  placeholder="https://"
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 z-20 border-t border-slate-200 dark:border-[#1f2a44] bg-white/95 dark:bg-[#111a2e]/95 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-500 truncate">
          {dirty ? "Saxlanmamış dəyişiklik var" : "Bütün dəyişikliklər saxlanıb"}
        </p>
        <Button variant="primary" icon={Save} loading={saving} onClick={save}>
          Yadda saxla
        </Button>
      </div>
    </div>
  );
}

export default AdminWebsite;
