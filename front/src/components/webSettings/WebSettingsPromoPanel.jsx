import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Ticket, Save, Loader2, Plus, Pencil, Trash2, Percent, Tag } from "lucide-react";
import { base_url, getAuthHeaders } from "../../api/index";
import { useLanguage } from "../../i18n/LanguageContext";
import { useWebSettings } from "./WebSettingsContext";

const isPromoActive = (value) => value === true || value === 1 || value === "1";

const BAKU_TZ = "Asia/Baku";

/** API UTC saxlayır; datetime-local həmişə Bakı vaxtı ilə doldurulur (brauzer saat qurşağı səhv verirdi). */
const toBakuDatetimeInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BAKU_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const promoStatusLabel = (p, t) => {
  if (!isPromoActive(p.is_active)) return { text: t("webSettings.promoInactive"), className: "bg-slate-200 text-slate-600" };
  if (p.is_usable === false && p.status_reason === "not_started") {
    return { text: t("webSettings.promoWaiting"), className: "bg-amber-100 text-amber-800" };
  }
  if (p.is_usable === false && p.status_reason === "expired") {
    return { text: t("webSettings.promoExpired"), className: "bg-red-100 text-red-800" };
  }
  if (p.is_usable === false && p.status_reason === "max_uses") {
    return { text: t("webSettings.promoMaxUses"), className: "bg-red-100 text-red-800" };
  }
  return { text: t("webSettings.promoActive"), className: "bg-green-100 text-green-800" };
};

const emptyPromo = {
  code: "",
  title: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  max_uses: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

const WebSettingsPromoPanel = () => {
  const { t } = useLanguage();
  const { saving, form, inputClass, labelClass, handleChange, handleSave } = useWebSettings();
  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [savingPromo, setSavingPromo] = useState(false);

  const fetchPromos = useCallback(async () => {
    try {
      const res = await axios.get(`${base_url}/restaurant/web-promo-codes`, getAuthHeaders());
      setPromos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error(t("webSettings.promoLoadError"));
    } finally {
      setLoadingPromos(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const resetPromoForm = () => {
    setPromoForm(emptyPromo);
    setEditingPromoId(null);
  };

  const savePromo = async (e) => {
    e.preventDefault();
    if (!promoForm.code.trim()) {
      toast.error(t("webSettings.promoCodeRequired"));
      return;
    }
    setSavingPromo(true);
    try {
      const body = {
        code: promoForm.code.trim().toUpperCase(),
        title: promoForm.title || null,
        description: promoForm.description || null,
        discount_type: promoForm.discount_type,
        discount_value: Number(promoForm.discount_value) || 0,
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
        valid_from: promoForm.valid_from || null,
        valid_until: promoForm.valid_until || null,
        is_active: Boolean(promoForm.is_active),
      };
      if (editingPromoId) {
        await axios.put(`${base_url}/restaurant/web-promo-codes/${editingPromoId}`, body, getAuthHeaders());
      } else {
        await axios.post(`${base_url}/restaurant/web-promo-codes`, body, getAuthHeaders());
      }
      resetPromoForm();
      fetchPromos();
      toast.success(t("webSettings.promoSaved"));
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0];
      toast.error(msg || t("webSettings.promoSaveError"));
    } finally {
      setSavingPromo(false);
    }
  };

  const editPromo = (p) => {
    setEditingPromoId(p.id);
    setPromoForm({
      code: p.code || "",
      title: p.title || "",
      description: p.description || "",
      discount_type: p.discount_type || "percent",
      discount_value: p.discount_value ?? "",
      max_uses: p.max_uses ?? "",
      valid_from: toBakuDatetimeInput(p.valid_from),
      valid_until: toBakuDatetimeInput(p.valid_until),
      is_active: isPromoActive(p.is_active),
    });
  };

  const deletePromo = async (id) => {
    if (!window.confirm(t("webSettings.promoDeleteConfirm"))) return;
    try {
      await axios.delete(`${base_url}/restaurant/web-promo-codes/${id}`, getAuthHeaders());
      if (editingPromoId === id) resetPromoForm();
      fetchPromos();
      toast.success(t("webSettings.promoDeleted"));
    } catch {
      toast.error(t("webSettings.promoSaveError"));
    }
  };

  const discountLabel = (p) =>
    p.discount_type === "fixed"
      ? `${p.discount_value} ₼`
      : `${p.discount_value}%`;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Ticket size={18} className="text-indigo-600" />
          {t("webSettings.promoSettings")}
        </div>
        <p className="text-xs text-slate-500">{t("webSettings.promoSettingsHint")}</p>
        <div>
          <label className={labelClass}>{t("webSettings.minOrderAmount")}</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            name="min_order_amount"
            value={form.min_order_amount ?? ""}
            onChange={handleChange}
            placeholder="0"
          />
          <p className="text-[11px] text-slate-500 mt-1">{t("webSettings.minOrderHint")}</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {t("webSettings.save")}
        </button>
      </form>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={savePromo} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Tag size={18} />
            {editingPromoId ? t("webSettings.promoEdit") : t("webSettings.promoNew")}
          </h3>
          <label className="block text-sm">
            <span className="text-slate-600">{t("webSettings.promoCodeField")}</span>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm uppercase"
              value={promoForm.code}
              onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">{t("webSettings.promoTitle")}</span>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              value={promoForm.title}
              onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">{t("webSettings.promoDescription")}</span>
            <textarea
              rows={2}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              value={promoForm.description}
              onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600 flex items-center gap-1">
                <Percent size={14} /> {t("webSettings.promoDiscountType")}
              </span>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                value={promoForm.discount_type}
                onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
              >
                <option value="percent">{t("webSettings.promoPercent")}</option>
                <option value="fixed">{t("webSettings.promoFixed")}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">{t("webSettings.promoValue")}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                value={promoForm.discount_value}
                onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600">{t("webSettings.promoMaxUses")}</span>
            <input
              type="number"
              min="1"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              value={promoForm.max_uses}
              onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600">{t("webSettings.promoValidFrom")}</span>
              <input
                type="datetime-local"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={promoForm.valid_from}
                onChange={(e) => setPromoForm({ ...promoForm, valid_from: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">{t("webSettings.promoValidUntil")}</span>
              <input
                type="datetime-local"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={promoForm.valid_until}
                onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500">{t("webSettings.promoDateHint")}</p>
          {(promoForm.valid_from || promoForm.valid_until) && (
            <button
              type="button"
              onClick={() => setPromoForm({ ...promoForm, valid_from: "", valid_until: "" })}
              className="text-xs text-indigo-600 hover:underline"
            >
              {t("webSettings.promoClearDates")}
            </button>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={promoForm.is_active}
              onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-slate-700">{t("webSettings.promoActive")}</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={savingPromo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingPromo ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {editingPromoId ? t("webSettings.promoUpdate") : t("webSettings.promoAdd")}
            </button>
            {editingPromoId && (
              <button
                type="button"
                onClick={resetPromoForm}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                {t("webSettings.promoCancel")}
              </button>
            )}
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="font-semibold text-slate-800 mb-3">{t("webSettings.promoList")}</h3>
          {loadingPromos ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="animate-spin mr-2" size={18} />
              {t("webSettings.loading")}
            </div>
          ) : promos.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">{t("webSettings.promoEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {promos.map((p) => {
                const status = promoStatusLabel(p, t);
                return (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{p.code}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                      <span className="text-xs text-indigo-600 font-medium">{discountLabel(p)}</span>
                    </div>
                    {p.title && <p className="text-sm text-slate-700 mt-0.5">{p.title}</p>}
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t("webSettings.promoUses", { count: p.uses_count || 0, max: p.max_uses || "∞" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => editPromo(p)} className="p-2 rounded-lg hover:bg-white text-slate-600">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => deletePromo(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSettingsPromoPanel;
