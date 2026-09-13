import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  MapPin,
  Phone,
  User,
  ExternalLink,
  X,
  ChevronLeft,
  Check,
  Trash2,
  Eye,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "react-toastify";
import { base_url, domain_url, getAuthHeaders } from "../api/index";
import { useLanguage } from "../i18n/LanguageContext";
import { getQuickOrderDetailTotal, getQuickOrderTotal } from "../utils/quickOrderHelpers";
import soundFile from "../assets/sound.mp3";

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const extractMapsUrl = (address) => {
  if (!address) return null;
  const match = address.match(/https?:\/\/[^\s]+google[^\s]*/i);
  return match ? match[0] : null;
};

const WebOrdersBell = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [menuSlug, setMenuSlug] = useState("");
  const [prevCount, setPrevCount] = useState(0);
  const initialLoad = useRef(true);
  const audioRef = useRef(null);

  const fetchWebOrders = async () => {
    try {
      const res = await axios.get(`${base_url}/quick-orders/web-inbox`, getAuthHeaders());
      const list = res.data || [];
      setOrders(list);
      if (initialLoad.current) {
        initialLoad.current = false;
      } else if (list.length > prevCount) {
        toast.info(t("nav.newWebOrder"));
        audioRef.current?.play().catch(() => {});
      }
      setPrevCount(list.length);
    } catch (e) {
      if (e.response?.status !== 403) console.error(e);
    }
  };

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`${base_url}/quick-orders/${id}`, getAuthHeaders());
      setDetail(res.data);
    } catch (e) {
      toast.error(t("nav.webOrderDetailError"));
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchMenuSlug = async () => {
    try {
      const res = await axios.get(`${base_url}/restaurant/web-settings`, getAuthHeaders());
      if (res.data?.slug) setMenuSlug(res.data.slug);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchWebOrders();
    fetchMenuSlug();
    const id = setInterval(fetchWebOrders, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
    else setDetail(null);
  }, [selectedId]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const count = orders.length;
  const publicMenuUrl = menuSlug ? `${domain_url}/menu/${menuSlug}` : null;

  const openModal = () => {
    setModalOpen(true);
    setSelectedId(null);
    setDetail(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedId(null);
    setDetail(null);
  };

  const handleAccept = async (id, openFullPage = false) => {
    setActionLoading(true);
    try {
      await axios.post(`${base_url}/quick-orders/${id}/acknowledge-web`, {}, getAuthHeaders());
      toast.success(t("nav.webOrderAccepted"));
      await fetchWebOrders();
      if (openFullPage) {
        closeModal();
        navigate(`/muster-siparis-ekle/${id}`);
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t("nav.webOrderActionError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(t("nav.webOrderRejectConfirm"))) return;
    setActionLoading(true);
    try {
      await axios.delete(`${base_url}/quick-orders/${id}`, getAuthHeaders());
      toast.success(t("nav.webOrderRejected"));
      setSelectedId(null);
      await fetchWebOrders();
      if (orders.length <= 1) closeModal();
    } catch (e) {
      toast.error(e.response?.data?.message || t("nav.webOrderActionError"));
    } finally {
      setActionLoading(false);
    }
  };

  const listOrder = selectedId ? orders.find((o) => o.id === selectedId) : null;
  const mapsUrl = extractMapsUrl(listOrder?.address || detail?.address);

  const modalContent = modalOpen ? (
    <div
      className="fixed inset-0 z-[200] flex items-stretch sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={closeModal}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-slate-200 dark:border-slate-700 h-full sm:h-auto sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {selectedId && (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Globe size={20} className="text-emerald-600 shrink-0" />
                {selectedId ? t("nav.webOrderDetail") : t("nav.webOrders")}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {selectedId ? listOrder?.name : `${count} ${t("nav.webOrdersPending")}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {publicMenuUrl && !selectedId && (
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                title={t("webSettings.preview")}
              >
                <ExternalLink size={18} />
              </a>
            )}
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {!selectedId ? (
            count === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                <p>{t("nav.webOrdersEmpty")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{o.name}</span>
                      <span className="text-[10px] text-slate-400">{formatTime(o.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <Phone size={11} /> {o.phone}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 flex items-start gap-1 mb-3 flex-1">
                      <MapPin size={11} className="shrink-0 mt-0.5" /> {o.address}
                    </p>
                    {o.order?.total_price != null && (
                      <p className="text-sm font-bold text-emerald-600 mb-3">
                        {getQuickOrderTotal(o).toFixed(2)} ₼
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedId(o.id)}
                        className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                      >
                        <Eye size={14} /> {t("common.detail")}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAccept(o.id, false)}
                        className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Check size={14} /> {t("nav.webOrderAccept")}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleReject(o.id)}
                        className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : detailLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : detail ? (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <User size={16} /> {t("nav.webOrderCustomer")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">{t("siparisler.fullName")}</span>
                    <p className="font-medium">{detail.name || listOrder?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">{t("siparisler.phone")}</span>
                    <p className="font-medium">
                      <a href={`tel:${detail.phone || listOrder?.phone}`} className="text-indigo-600">
                        {detail.phone || listOrder?.phone}
                      </a>
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 text-xs">{t("siparisler.address")}</span>
                    <p className="font-medium whitespace-pre-wrap">{detail.address || listOrder?.address}</p>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 hover:underline"
                      >
                        <MapPin size={12} /> Google Maps-də aç
                      </a>
                    )}
                  </div>
                  {(detail.note || listOrder?.note) && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 text-xs">Qeyd</span>
                      <p className="text-sm text-slate-600">{detail.note || listOrder?.note}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-sm">
                  {t("masaSiparis.order")} — {detail.order?.stocks?.length || 0} məhsul
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(detail.order?.stocks || []).map((item) => (
                    <div key={item.pivot_id || item.id} className="flex justify-between items-center px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{item.name}</span>
                        {item.detail && (
                          <span className="text-xs text-slate-500 ml-2">
                            ({item.detail.count} {item.detail.unit})
                          </span>
                        )}
                        <span className="text-slate-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">{Number(item.price).toFixed(2)} ₼</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 space-y-1">
                  {Number(detail.promo_discount || 0) > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Ara cəm</span>
                        <span>{Number(detail.order?.total_price || 0).toFixed(2)} ₼</span>
                      </div>
                      <div className="flex justify-between text-sm text-amber-700">
                        <span>Promo ({detail.promo_code})</span>
                        <span>-{Number(detail.promo_discount).toFixed(2)} ₼</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Cəmi</span>
                    <span className="text-emerald-700">{getQuickOrderDetailTotal(detail).toFixed(2)} ₼</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {selectedId && detail && !detailLoading && (
          <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 bg-white dark:bg-slate-900 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAccept(selectedId, true)}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {t("nav.webOrderAcceptOpen")}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleReject(selectedId)}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 size={18} /> {t("nav.webOrderReject")}
            </button>
            <Link
              to={`/muster-siparis-ekle/${selectedId}`}
              onClick={closeModal}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50"
            >
              <Eye size={18} /> {t("nav.webOrderFullPage")}
            </Link>
          </div>
        )}

        {!selectedId && count > 0 && (
          <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Link
              to="/siparisler?filter=web"
              onClick={closeModal}
              className="block w-full text-center py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl"
            >
              {t("nav.webOrdersAll")}
            </Link>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`relative p-2 rounded-lg border transition ${
          count > 0
            ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 animate-pulse"
            : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        }`}
        title={t("nav.webOrders")}
        aria-label={t("nav.webOrders")}
      >
        <Globe size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold grid place-items-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {typeof document !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : null}

      <audio ref={audioRef} src={soundFile} preload="auto" />
    </>
  );
};

export default WebOrdersBell;
