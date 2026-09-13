import React, { useCallback, useEffect, useMemo, useState } from "react";
import { pageTitle } from "../config/branding";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SelectCourierModal from "../components/SelectCourierModal";
import QuickSalePanel from "../components/QuickSalePanel";
import AccessDenied from "../components/AccessDenied";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import DontActiveAcount from "../components/DontActiveAcount";
import HesapKesSip from "../components/HesapKesSip";
import { useLanguage } from "../i18n/LanguageContext";
import { useUiSettings } from "../context/UiSettingsContext";
import {
  RefreshCw,
  Search,
  Globe,
  Phone,
  MapPin,
  Truck,
  Trash2,
  Receipt,
  Eye,
  ShoppingBag,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { getQuickOrderTotal } from "../utils/quickOrderHelpers";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const isWebOrder = (o) => /\[Web sifariş\]|\[Web qəbul edildi\]/i.test(o.note || "");
const isWebPending = (o) => (o.note || "").includes("[Web sifariş]");

const extractMapsUrl = (address) => {
  if (!address) return null;
  const m = address.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
};

const formatMoney = (n) => `${Number(n || 0).toFixed(2)} ₼`;

function Siparisler() {
  const { t } = useLanguage();
  const { isFeatureVisible, isOptionEnabled, loaded: uiSettingsLoaded } = useUiSettings();
  const quickSaleVisible = isFeatureVisible("siparisler_quick_sale");
  const quickSaleAuto = isOptionEnabled("siparisler_quick_sale_auto");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get("filter") || "all";
  const highlightId = searchParams.get("highlight");

  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(urlFilter === "web" ? "web" : "all");

  const [showDetail, setShowDetail] = useState(false);
  const [showSelectCourier, setShowSelectCourier] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [quickSaleSession, setQuickSaleSession] = useState(0);
  const [odersIdMassa, setodersIdMassa] = useState({});
  const [DataItemOrder, setDataItemOrder] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);

  const kalan = (odersIdMassa.total_price || 0) - (odersIdMassa.total_prepayment || 0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, couriersRes] = await Promise.all([
        axios.get(`${base_url}/quick-orders`, getHeaders()),
        axios.get(`${base_url}/couriers`, getHeaders()).catch(() => ({ data: [] })),
      ]);
      setOrders(ordersRes.data || []);
      setCouriers(couriersRes.data || []);
    } catch (error) {
      if (error.response?.status === 403) {
        const msg = error.response.data?.message;
        if (msg?.includes("active restaurant")) setActiveUser(true);
        else if (msg === "Forbidden") setAccessDenied(true);
      }
      toast.error(t("siparisler.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (uiSettingsLoaded && quickSaleVisible && quickSaleAuto) {
      setShowAddOrder(true);
    }
  }, [uiSettingsLoaded, quickSaleVisible, quickSaleAuto]);

  useEffect(() => {
    if (urlFilter === "web") setTab("web");
  }, [urlFilter]);

  const setTabAndUrl = (key) => {
    setTab(key);
    if (key === "web") setSearchParams({ filter: "web" });
    else setSearchParams({});
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (tab === "web") list = list.filter(isWebOrder);
    else if (tab === "manual") list = list.filter((o) => !isWebOrder(o));

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.name?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, tab, search]);

  const stats = useMemo(() => {
    const web = orders.filter(isWebOrder);
    const pending = orders.filter(isWebPending);
    const total = orders.reduce((s, o) => s + getQuickOrderTotal(o), 0);
    return { all: orders.length, web: web.length, pending: pending.length, total };
  }, [orders]);

  const getOrderTotal = getQuickOrderTotal;

  const createObjHesabKes = (order) => {
    setodersIdMassa({
      id: order.id,
      total_price: getOrderTotal(order),
      total_prepayment: Number(order.order?.total_prepayment ?? 0),
    });
    setShowDetail(true);
  };

  const updateCustomerInfo = async (order, courierId) => {
    try {
      await axios.put(
        `${base_url}/quick-orders/${order.id}`,
        {
          name: order.name,
          phone: order.phone,
          address: order.address,
          courier_id: courierId,
        },
        getHeaders()
      );
      toast.success(t("siparisler.courierAssigned"));
      setShowSelectCourier(false);
      fetchOrders();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(t("siparisler.deleteConfirm"))) return;
    try {
      await axios.delete(`${base_url}/quick-orders/${orderId}`, getHeaders());
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(t("siparisler.deleted"));
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleApiError = (error) => {
    if (error.response?.status === 403) {
      const msg = error.response.data?.message;
      if (msg?.includes("active restaurant")) setActiveUser(true);
      else if (msg === "Forbidden") setAccessDenied(true);
    } else {
      toast.error(t("common.unknownError"));
    }
  };

  if (ActiveUser) return <DontActiveAcount onClose={setActiveUser} />;
  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      <Helmet>
        <title>{pageTitle(t("siparisler.title"))}</title>
      </Helmet>

      <section className="p-3 sm:p-4 max-w-[1400px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("siparisler.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t("siparisler.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {t("masalar.refresh")}
            </button>
            {quickSaleVisible && !quickSaleAuto && (
              <button
                type="button"
                onClick={() => setShowAddOrder(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 shadow-sm"
              >
                <Zap size={16} />
                {t("siparisler.quickSale")}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t("siparisler.statAll"), value: stats.all, icon: ShoppingBag, color: "indigo" },
            { label: t("siparisler.statWeb"), value: stats.web, icon: Globe, color: "emerald" },
            { label: t("siparisler.statWebPending"), value: stats.pending, icon: Globe, color: "amber" },
            { label: t("siparisler.statTotal"), value: formatMoney(stats.total), icon: Receipt, color: "violet" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <s.icon size={14} />
                {s.label}
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: t("common.all") },
              { key: "web", label: t("siparisler.tabWeb") },
              { key: "manual", label: t("siparisler.tabManual") },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTabAndUrl(item.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === item.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("siparisler.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <p className="text-xs text-slate-500">
            {t("common.listCount", { count: filtered.length })}
          </p>
        </div>

        {/* Content */}
        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
            <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{t("siparisler.empty")}</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((order) => {
                const maps = extractMapsUrl(order.address);
                const highlighted = highlightId && String(order.id) === highlightId;
                return (
                  <div
                    key={order.id}
                    className={`rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm ${
                      highlighted
                        ? "border-emerald-400 ring-2 ring-emerald-200"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{order.name}</span>
                          {isWebOrder(order) && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isWebPending(order) ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              Web
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.created_at).toLocaleString("az-AZ")}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">{formatMoney(getOrderTotal(order))}</span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      <p className="flex items-center gap-2"><Phone size={13} /> {order.phone}</p>
                      <p className="flex items-start gap-2 line-clamp-2"><MapPin size={13} className="shrink-0 mt-0.5" /> {order.address}</p>
                      {maps && (
                        <a href={maps} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                          {t("siparisler.openMap")}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/muster-siparis-ekle/${order.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                      >
                        <Eye size={14} /> {t("common.detail")}
                      </button>
                      <button
                        type="button"
                        onClick={() => createObjHesabKes(order)}
                        className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-cyan-600 text-white text-xs font-medium"
                      >
                        <Receipt size={14} /> {t("siparisler.closeBill")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDataItemOrder(order); setShowSelectCourier(true); }}
                        className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg border border-slate-200 text-xs"
                      >
                        <Truck size={14} /> {order.courier?.name || "—"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="inline-flex items-center justify-center py-2 px-3 rounded-lg bg-red-50 text-red-600 text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{t("siparisler.fullName")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{t("siparisler.time")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">{t("siparisler.total")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{t("siparisler.phone")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{t("siparisler.address")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{t("siparisler.courier")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">{t("siparisler.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map((order) => {
                      const highlighted = highlightId && String(order.id) === highlightId;
                      const maps = extractMapsUrl(order.address);
                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                            highlighted ? "bg-emerald-50 dark:bg-emerald-950/30" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <Link to={`/muster-siparis-ekle/${order.id}`} className="font-medium text-indigo-600 hover:underline flex items-center gap-2">
                              {order.name}
                              {isWebOrder(order) && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isWebPending(order) ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                }`}>Web</span>
                              )}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-600 text-right whitespace-nowrap">
                            {formatMoney(getOrderTotal(order))}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <a href={`tel:${order.phone}`} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600">{order.phone}</a>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px]">
                            <span className="line-clamp-2">{order.address}</span>
                            {maps && (
                              <a href={maps} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline block mt-0.5">
                                {t("siparisler.openMap")}
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => { setDataItemOrder(order); setShowSelectCourier(true); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Truck size={14} className="text-slate-400" />
                              {order.courier?.name || t("siparisler.assignCourier")}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                to={`/muster-siparis-ekle/${order.id}`}
                                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                title={t("common.detail")}
                              >
                                <Eye size={16} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => createObjHesabKes(order)}
                                className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-50"
                                title={t("siparisler.closeBill")}
                              >
                                <Receipt size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                title={t("common.delete")}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {showSelectCourier && (
        <SelectCourierModal
          updateCustomerInfo={updateCustomerInfo}
          DataItemOrder={DataItemOrder}
          couriers={couriers}
          onSelect={() => {}}
          onClose={() => setShowSelectCourier(false)}
        />
      )}

      {quickSaleVisible && showAddOrder && (
        <QuickSalePanel
          key={quickSaleSession}
          onClose={() => setShowAddOrder(false)}
          onComplete={() => {
            fetchOrders();
            if (quickSaleAuto) {
              setQuickSaleSession((s) => s + 1);
              setShowAddOrder(true);
            } else {
              setShowAddOrder(false);
            }
          }}
        />
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("siparisler.closeBill")}</h3>
              <button type="button" onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5 max-h-[80vh] overflow-y-auto">
              <HesapKesSip orderId={odersIdMassa.id} totalAmount={kalan} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Siparisler;
