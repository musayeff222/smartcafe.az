import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { base_url, domain_url, getAuthHeaders } from "../../api/index";
import { useLanguage } from "../../i18n/LanguageContext";
import { getTemplateDefaults } from "../webMenu/themes";

const WebSettingsContext = createContext(null);

export function WebSettingsProvider({ children }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    custom_domain: "",
    domain_status: "none",
    dns_hints: { cname_target: "login.smartcafe.az", server_ip: "76.13.136.137" },
    is_active: true,
    accept_orders: true,
    web_title: "",
    web_subtitle: "",
    theme_color: "#6366f1",
    bg_color: "#f8fafc",
    theme_template: "classic",
    instagram_url: "",
    whatsapp: "",
    location_url: "",
    tiktok_url: "",
    website_url: "",
    domain_note: "",
    min_order_amount: "",
    restaurant_name: "",
    restaurant_logo: "",
    banner_path: "",
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const publicUrl = form.slug ? `${domain_url}/menu/${form.slug}` : "";

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${base_url}/restaurant/web-settings`, getAuthHeaders());
      setForm((prev) => ({ ...prev, ...res.data }));
    } catch (e) {
      console.error(e);
      toast.error(t("webSettings.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const selectTemplate = (templateId) => {
    const defaults = getTemplateDefaults(templateId);
    setForm((prev) => ({
      ...prev,
      theme_template: templateId,
      theme_color: defaults.theme,
      bg_color: defaults.bg,
    }));
  };

  const handleBannerPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const removeBanner = async () => {
    try {
      const res = await axios.delete(`${base_url}/restaurant/web-settings/banner`, getAuthHeaders());
      setForm((prev) => ({ ...prev, ...res.data, banner_path: null }));
      setBannerFile(null);
      setBannerPreview(null);
      toast.success(t("webSettings.bannerRemoved"));
    } catch {
      toast.error(t("webSettings.saveError"));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t("webSettings.linkCopied"));
    } catch {
      toast.error(t("webSettings.copyFailed"));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (bannerFile) {
        const fd = new FormData();
        fd.append("banner", bannerFile);
        const bannerRes = await axios.post(`${base_url}/restaurant/web-settings/banner`, fd, {
          headers: {
            ...getAuthHeaders().headers,
            "Content-Type": "multipart/form-data",
          },
        });
        setForm((prev) => ({ ...prev, ...bannerRes.data }));
        setBannerFile(null);
        setBannerPreview(null);
      }

      const payload = {
        slug: form.slug,
        custom_domain: form.custom_domain || null,
        is_active: form.is_active,
        accept_orders: form.accept_orders,
        web_title: form.web_title,
        web_subtitle: form.web_subtitle,
        theme_color: form.theme_color,
        bg_color: form.bg_color,
        theme_template: form.theme_template || "classic",
        instagram_url: form.instagram_url || null,
        whatsapp: form.whatsapp || null,
        location_url: form.location_url || null,
        tiktok_url: form.tiktok_url || null,
        website_url: form.website_url || null,
        domain_note: form.domain_note || null,
        min_order_amount: form.min_order_amount || null,
      };
      const res = await axios.put(`${base_url}/restaurant/web-settings`, payload, getAuthHeaders());
      setForm((prev) => ({ ...prev, ...res.data }));
      toast.success(t("webSettings.saved"));
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.slug?.[0];
      toast.error(msg || t("webSettings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const domainStatusLabel = {
    none: t("webSettings.domainNone"),
    pending: t("webSettings.domainPending"),
    active: t("webSettings.domainActive"),
    rejected: t("webSettings.domainRejected"),
  };

  const cnameTarget = form.dns_hints?.cname_target || "login.smartcafe.az";
  const serverIp = form.dns_hints?.server_ip || "76.13.136.137";

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const labelClass = "block text-sm font-medium text-slate-700";

  const value = {
    loading,
    saving,
    form,
    bannerFile,
    bannerPreview,
    publicUrl,
    domainStatusLabel,
    cnameTarget,
    serverIp,
    inputClass,
    labelClass,
    handleChange,
    selectTemplate,
    handleBannerPick,
    removeBanner,
    copyLink,
    handleSave,
  };

  return <WebSettingsContext.Provider value={value}>{children}</WebSettingsContext.Provider>;
}

export function useWebSettings() {
  const ctx = useContext(WebSettingsContext);
  if (!ctx) throw new Error("useWebSettings must be used within WebSettingsProvider");
  return ctx;
}
