import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Phone,
  MapPin,
  Loader2,
  Navigation,
  ShoppingBag,
} from "lucide-react";
import { toast } from "react-toastify";
import AccessDenied from "./AccessDenied";
import { base_url } from "../api/index";
import { useLanguage } from "../i18n/LanguageContext";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const AddOrderModal = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const fullAddress = mapsUrl
    ? address.trim()
      ? `${address.trim()}\n${mapsUrl}`
      : mapsUrl
    : address.trim();

  const canSubmit = name.trim() && phone.trim() && fullAddress;

  const sendLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("siparisler.locationUnsupported"));
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapsUrl(`https://www.google.com/maps?q=${lat},${lng}`);
        setLocLoading(false);
        toast.success(t("siparisler.locationAdded"));
      },
      () => {
        setLocLoading(false);
        toast.error(t("siparisler.locationError"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error(t("siparisler.fieldRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${base_url}/quick-orders`,
        { name: name.trim(), phone: phone.trim(), address: fullAddress },
        getHeaders()
      );
      const orderId = response.data.id;
      onSuccess?.();
      navigate(`/muster-siparis-ekle/${orderId}`);
    } catch (error) {
      if (error.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error(t("common.unknownError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("siparisler.addNew")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t("siparisler.addModalSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <User size={14} />
              {t("siparisler.fullName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("siparisler.namePlaceholder")}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <Phone size={14} />
              {t("siparisler.phone")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("siparisler.phonePlaceholder")}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <MapPin size={14} />
              {t("siparisler.address")}
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("siparisler.addressPlaceholder")}
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
            />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={sendLocation}
                disabled={locLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50"
              >
                {locLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Navigation size={14} />
                )}
                {t("siparisler.useLocation")}
              </button>
              {mapsUrl && (
                <>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {t("siparisler.openMap")}
                  </a>
                  <button
                    type="button"
                    onClick={() => setMapsUrl("")}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    {t("common.delete")}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t("common.close")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t("siparisler.continueToMenu")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
