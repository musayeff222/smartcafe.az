import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { base_url } from "../api/index";
import {
  Loader2,
  Save,
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  Tag,
  Percent,
} from "lucide-react";

function authHeaders() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
}

const emptyPlan = {
  name: "",
  slug: "",
  tag: "",
  pitch: "",
  price_label: "Fərdi təklif",
  featuresText: "",
  is_featured: false,
  sort_order: 0,
  is_active: true,
};

const emptyPromo = {
  code: "",
  title: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  max_uses: "",
  valid_from: "",
  valid_until: "",
  marketing_plan_id: "",
  show_on_landing: true,
  is_active: true,
};

export default function MarketingAdminPanel() {
  const [tab, setTab] = useState("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(null);
  const [plans, setPlans] = useState([]);
  const [promos, setPromos] = useState([]);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [err, setErr] = useState("");

  const loadAll = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const [cRes, pRes, prRes] = await Promise.all([
        axios.get(`${base_url}/marketing/site-content`, authHeaders()),
        axios.get(`${base_url}/marketing-plans`, authHeaders()),
        axios.get(`${base_url}/marketing-promos`, authHeaders()),
      ]);
      setContent({
        ...cRes.data,
        faqJson: JSON.stringify(
          (cRes.data.payload && cRes.data.payload.faq) || [],
          null,
          2
        ),
      });
      setPlans(Array.isArray(pRes.data) ? pRes.data : []);
      setPromos(Array.isArray(prRes.data) ? prRes.data : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          "Məlumat yüklənmədi (yalnız super-admin)."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveContent = async () => {
    if (!content) return;
    setSaving(true);
    setErr("");
    try {
      let faq = [];
      try {
        faq = JSON.parse(content.faqJson || "[]");
      } catch {
        faq = content.payload?.faq || [];
      }
      const payload = {
        ...content.payload,
        faq,
      };
      await axios.put(
        `${base_url}/marketing/site-content`,
        { payload },
        authHeaders()
      );
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Saxlama xətası");
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async () => {
    setSaving(true);
    setErr("");
    try {
      const features = planForm.featuresText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        name: planForm.name,
        slug: planForm.slug || undefined,
        tag: planForm.tag || null,
        pitch: planForm.pitch || null,
        price_label: planForm.price_label || "Fərdi təklif",
        features,
        is_featured: !!planForm.is_featured,
        sort_order: Number(planForm.sort_order) || 0,
        is_active: !!planForm.is_active,
      };
      if (editingPlanId) {
        await axios.put(
          `${base_url}/marketing-plans/${editingPlanId}`,
          body,
          authHeaders()
        );
      } else {
        await axios.post(`${base_url}/marketing-plans`, body, authHeaders());
      }
      setPlanForm(emptyPlan);
      setEditingPlanId(null);
      await loadAll();
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          JSON.stringify(e?.response?.data) ||
          "Plan saxlanmadı"
      );
    } finally {
      setSaving(false);
    }
  };

  const editPlan = (p) => {
    setEditingPlanId(p.id);
    setPlanForm({
      name: p.name,
      slug: p.slug,
      tag: p.tag || "",
      pitch: p.pitch || "",
      price_label: p.price_label || "Fərdi təklif",
      featuresText: (p.features || []).join("\n"),
      is_featured: !!p.is_featured,
      sort_order: p.sort_order ?? 0,
      is_active: !!p.is_active,
    });
    setTab("plans");
  };

  const deletePlan = async (id) => {
    if (!window.confirm("Plan silinsin?")) return;
    try {
      await axios.delete(`${base_url}/marketing-plans/${id}`, authHeaders());
      if (editingPlanId === id) {
        setEditingPlanId(null);
        setPlanForm(emptyPlan);
      }
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Silinmədi");
    }
  };

  const savePromo = async () => {
    setSaving(true);
    setErr("");
    try {
      const body = {
        code: promoForm.code,
        title: promoForm.title || null,
        description: promoForm.description || null,
        discount_type: promoForm.discount_type,
        discount_value: Number(promoForm.discount_value),
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
        valid_from: promoForm.valid_from || null,
        valid_until: promoForm.valid_until || null,
        marketing_plan_id: promoForm.marketing_plan_id || null,
        show_on_landing: !!promoForm.show_on_landing,
        is_active: !!promoForm.is_active,
      };
      if (editingPromoId) {
        await axios.put(
          `${base_url}/marketing-promos/${editingPromoId}`,
          body,
          authHeaders()
        );
      } else {
        await axios.post(`${base_url}/marketing-promos`, body, authHeaders());
      }
      setPromoForm(emptyPromo);
      setEditingPromoId(null);
      await loadAll();
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          JSON.stringify(e?.response?.data) ||
          "Promo saxlanmadı"
      );
    } finally {
      setSaving(false);
    }
  };

  const editPromo = (p) => {
    setEditingPromoId(p.id);
    setPromoForm({
      code: p.code,
      title: p.title || "",
      description: p.description || "",
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      max_uses: p.max_uses ?? "",
      valid_from: p.valid_from ? p.valid_from.slice(0, 16) : "",
      valid_until: p.valid_until ? p.valid_until.slice(0, 16) : "",
      marketing_plan_id: p.marketing_plan_id || "",
      show_on_landing: !!p.show_on_landing,
      is_active: !!p.is_active,
    });
    setTab("promos");
  };

  const deletePromo = async (id) => {
    if (!window.confirm("Promo kod silinsin?")) return;
    try {
      await axios.delete(`${base_url}/marketing-promos/${id}`, authHeaders());
      if (editingPromoId === id) {
        setEditingPromoId(null);
        setPromoForm(emptyPromo);
      }
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Silinmədi");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm">Marketing məlumatları yüklənir...</p>
      </div>
    );
  }

  const payload = content?.payload || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600 flex items-center gap-1">
          <LayoutGrid size={16} />
          smartcafe.az saytı
        </span>
        {["content", "plans", "promos"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === k
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {k === "content" && "Məzmun"}
            {k === "plans" && "Planlar"}
            {k === "promos" && "Promo kodlar"}
          </button>
        ))}
        <button
          type="button"
          onClick={loadAll}
          className="ml-auto text-sm text-indigo-600 hover:underline"
        >
          Yenilə
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
          {err}
        </div>
      )}

      {tab === "content" && content && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm text-slate-500">
            Bu sahələr{" "}
            <strong className="text-slate-700">smartcafe.az</strong> üzərindəki
            ictimai səhifədə göstərilir (API:{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">/marketing-page</code>
            ).
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Üst sətir (eyebrow)</span>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={payload.eyebrow || ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    payload: { ...payload, eyebrow: e.target.value },
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Əlaqə email</span>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={payload.contact_email || ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    payload: { ...payload, contact_email: e.target.value },
                  })
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Hero başlıq</span>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={payload.hero_title || ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  payload: { ...payload, hero_title: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Hero mətn</span>
            <textarea
              rows={3}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={payload.hero_lead || ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  payload: { ...payload, hero_lead: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Giriş URL</span>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={payload.login_url || ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  payload: { ...payload, login_url: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Qiymət bölməsi mətni</span>
            <textarea
              rows={2}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={payload.pricing_intro || ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  payload: { ...payload, pricing_intro: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">FAQ (JSON massiv)</span>
            <textarea
              rows={8}
              className="mt-1 w-full font-mono text-xs border border-slate-200 rounded-lg px-3 py-2"
              value={content.faqJson ?? ""}
              onChange={(e) =>
                setContent({ ...content, faqJson: e.target.value })
              }
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={saveContent}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Məzmunu saxla
          </button>
        </div>
      )}

      {tab === "plans" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">
              {editingPlanId ? "Planı redaktə et" : "Yeni plan"}
            </h3>
            {["name", "slug", "tag", "price_label"].map((field) => (
              <label key={field} className="block text-sm">
                <span className="text-slate-600 capitalize">{field}</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={planForm[field]}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, [field]: e.target.value })
                  }
                />
              </label>
            ))}
            <label className="block text-sm">
              <span className="text-slate-600">Təsvir (pitch)</span>
              <textarea
                rows={2}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={planForm.pitch}
                onChange={(e) =>
                  setPlanForm({ ...planForm, pitch: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Xüsusiyyətlər (hər sətirdə bir)</span>
              <textarea
                rows={5}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={planForm.featuresText}
                onChange={(e) =>
                  setPlanForm({ ...planForm, featuresText: e.target.value })
                }
              />
            </label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.is_featured}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, is_featured: e.target.checked })
                  }
                />
                Seçilmiş plan
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.is_active}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, is_active: e.target.checked })
                  }
                />
                Aktiv
              </label>
              <label className="inline-flex items-center gap-1">
                Sıra
                <input
                  type="number"
                  className="w-20 border border-slate-200 rounded px-2 py-1"
                  value={planForm.sort_order}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      sort_order: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={savePlan}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
              >
                <Plus size={16} />
                {editingPlanId ? "Yenilə" : "Əlavə et"}
              </button>
              {editingPlanId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlanId(null);
                    setPlanForm(emptyPlan);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  Ləğv et
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
              Mövcud planlar
            </div>
            <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-3 flex items-start justify-between gap-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {p.slug} · {p.is_active ? "aktiv" : "deaktiv"}
                      {p.is_featured ? " · ★" : ""}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => editPlan(p)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePlan(p.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "promos" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Tag size={18} />
              {editingPromoId ? "Promo redaktə" : "Yeni promo kod"}
            </h3>
            <label className="block text-sm">
              <span className="text-slate-600">Kod</span>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase"
                value={promoForm.code}
                onChange={(e) =>
                  setPromoForm({
                    ...promoForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Başlıq (saytda)</span>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={promoForm.title}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, title: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Açıqlama</span>
              <textarea
                rows={2}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={promoForm.description}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, description: e.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  <Percent size={14} /> Endirim növü
                </span>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={promoForm.discount_type}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      discount_type: e.target.value,
                    })
                  }
                >
                  <option value="percent">Faiz (%)</option>
                  <option value="fixed">Sabit məbləğ</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Dəyər</span>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={promoForm.discount_value}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      discount_value: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-slate-600">Maks. istifadə (boş = limitsiz)</span>
              <input
                type="number"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={promoForm.max_uses}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, max_uses: e.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-slate-600">Etibarlılıq başlanğıcı</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={promoForm.valid_from}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, valid_from: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Son tarix</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={promoForm.valid_until}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      valid_until: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-slate-600">İstəyə bağlı plan (FK)</span>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={promoForm.marketing_plan_id}
                onChange={(e) =>
                  setPromoForm({
                    ...promoForm,
                    marketing_plan_id: e.target.value,
                  })
                }
              >
                <option value="">— hamısı —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={promoForm.show_on_landing}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      show_on_landing: e.target.checked,
                    })
                  }
                />
                smartcafe.az-da göstər
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={promoForm.is_active}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, is_active: e.target.checked })
                  }
                />
                Aktiv
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={savePromo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
              >
                {editingPromoId ? "Yenilə" : "Əlavə et"}
              </button>
              {editingPromoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPromoId(null);
                    setPromoForm(emptyPromo);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  Ləğv et
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
              Promo siyahısı
            </div>
            <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto text-sm">
              {promos.map((p) => (
                <li key={p.id} className="px-4 py-3 flex justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-indigo-700">
                      {p.code}
                    </div>
                    <div className="text-xs text-slate-500">
                      {p.discount_type === "percent"
                        ? `${p.discount_value}%`
                        : `${p.discount_value} AZN`}{" "}
                      · {p.is_active ? "aktiv" : "deaktiv"}
                      {p.show_on_landing ? " · sayt" : ""}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => editPromo(p)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePromo(p.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
