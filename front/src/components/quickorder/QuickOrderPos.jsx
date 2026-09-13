import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
  X,
  Minus,
  Plus,
  ArrowLeft,
  Search,
  ChefHat,
  ShoppingBag,
  Utensils,
  User,
  Phone,
  MapPin,
  Navigation,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AccessDenied from "../AccessDenied";
import PasswordScreenFour from "../ScreenPassword4";
import OrderTable from "../masasiparis/OrderTable";
import PaymentSummary from "../masasiparis/PaymentSummary";
import TotalPriceHesab from "../masasiparis/TotalPriceHesab";
import HesapKesSip from "../HesapKesSip";
import OncedenPopop from "../masasiparis/OncedenPopop";
import { base_url, img_url } from "../../api/index";
import { useLanguage } from "../../i18n/LanguageContext";
import { getQuickOrderDetailTotal } from "../../utils/quickOrderHelpers";
import {
  buildLocationQrHtml,
  escapeReceiptHtml,
  formatAddressForReceipt,
  resolveReceiptMapsUrl,
} from "../../utils/receiptLocationQr";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const QuickOrderPos = ({
  initialQuickOrderId = null,
  mode = "page",
  onBack,
  onComplete,
}) => {
  const { t } = useLanguage();
  const fis = localStorage.getItem("fisYazisi");
  const role = localStorage.getItem("role");

  const [quickOrderId, setQuickOrderId] = useState(initialQuickOrderId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const [urunType, setUrunType] = useState(0);
  const [stockGroups, setStockGroups] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [isStocksLoading, setIsStocksLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [mobileView, setMobileView] = useState("menu");
  const [customerOpen, setCustomerOpen] = useState(!initialQuickOrderId);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(() => {
    try {
      return localStorage.getItem("masa_siparis_groups_expanded") === "1";
    } catch {
      return false;
    }
  });

  const [orderDetails, setOrderDetails] = useState([]);
  const [totalPrice, setTotalPrice] = useState({});
  const [odersIdMassa, setOdersIdMassa] = useState({});
  const [refreshFetch, setRefreshFetch] = useState(false);
  const [oncedenodePopop, setOncedenodePopop] = useState(false);
  const [HesabKes, setHesabKes] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [creating, setCreating] = useState(false);

  const [orderModal, setNoOrderModal] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [modalData, setModalData] = useState({ name: "", desc: "", price: "" });
  const [selectedProduct, setSelectedProduct] = useState({ id: null, name: "", price: 0, quantity: 1 });
  const [handleModalMetbex, setHandleModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [openRows, setOpenRows] = useState({});
  const [showPasswordScreen, setShowPasswordScreen] = useState(false);
  const [pendingRemoveData, setPendingRemoveData] = useState(null);

  const fullAddress = useMemo(() => {
    const addr = address.trim();
    if (mapsUrl) return addr ? `${addr}\n${mapsUrl}` : mapsUrl;
    return addr;
  }, [address, mapsUrl]);

  const buildCustomerPayload = () => ({
    name: name.trim() || t("siparisler.anonymousCustomer"),
    phone: phone.trim() || "-",
    address: fullAddress.trim() || "-",
  });

  const displayName = name.trim() || t("siparisler.anonymousCustomer");

  const toggleGroupsExpanded = () => {
    setIsGroupsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("masa_siparis_groups_expanded", next ? "1" : "0");
      } catch (e) {}
      return next;
    });
  };

  const replaceImage = (url) => (url ? `${img_url}/${url}` : "");

  const fetchStockGroups = async () => {
    try {
      const res = await axios.get(`${base_url}/stock-groups`, getHeaders());
      setStockGroups(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuickOrder = useCallback(async (overrideId) => {
    const oid = overrideId ?? quickOrderId;
    if (!oid) return;
    try {
      const res = await axios.get(`${base_url}/quick-orders/${oid}`, getHeaders());
      const { order } = res.data;
      setName(res.data.name || "");
      setPhone(res.data.phone === "-" ? "" : res.data.phone || "");
      setAddress(res.data.address || "");
      setOrderNote(res.data.note || "");
      const mapsFromAddress = resolveReceiptMapsUrl(res.data.address);
      if (mapsFromAddress) setMapsUrl(mapsFromAddress);

      const items = (order?.stocks || []).map((stock) => ({
        id: stock.id,
        name: stock.name,
        quantity: stock.quantity,
        price: stock.price,
        pivot_id: stock.pivot_id,
        unit: stock.detail?.unit,
        count: stock.detail?.count,
        detail_id: stock.detail,
        type: "stock",
      }));

      const total = getQuickOrderDetailTotal(res.data);
      const prepay = Number(order?.total_prepayment || 0);
      setOrderDetails(items);
      setOdersIdMassa({ id: order.id, total_price: total, total_prepayment: prepay });
      setTotalPrice({ total, total_prepare: prepay, kalan: total - prepay });
    } catch (e) {
      console.error(e);
    }
  }, [quickOrderId]);

  useEffect(() => {
    fetchStockGroups();
    if (quickOrderId) fetchQuickOrder();
  }, [quickOrderId, refreshFetch, fetchQuickOrder]);

  useEffect(() => {
    const stored = localStorage.getItem("urunType");
    if (stored) setUrunType(Number(stored));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsStocksLoading(true);
    (async () => {
      try {
        const res = await axios.get(`${base_url}/stocks`, {
          ...getHeaders(),
          params: urunType === 0 ? {} : { stock_group_id: urunType },
          signal: controller.signal,
        });
        setStocks(res.data || []);
      } catch (e) {
        if (e?.name !== "CanceledError" && e?.code !== "ERR_CANCELED") console.error(e);
      } finally {
        setIsStocksLoading(false);
      }
    })();
    localStorage.setItem("urunType", urunType);
    return () => controller.abort();
  }, [urunType]);

  const ensureOrder = async () => {
    if (quickOrderId) return quickOrderId;
    setCreating(true);
    try {
      const res = await axios.post(
        `${base_url}/quick-orders`,
        buildCustomerPayload(),
        getHeaders()
      );
      const id = res.data.id;
      setQuickOrderId(id);
      return id;
    } catch (e) {
      if (e.response?.status === 403) setAccessDenied(true);
      else toast.error(t("common.unknownError"));
      return null;
    } finally {
      setCreating(false);
    }
  };

  const saveCustomerIfNeeded = async () => {
    if (!quickOrderId) return;
    try {
      await axios.put(
        `${base_url}/quick-orders/${quickOrderId}`,
        buildCustomerPayload(),
        getHeaders()
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStock = async (stockId, selected = null) => {
    const id = await ensureOrder();
    if (!id) return;
    await saveCustomerIfNeeded();
    const detailId = selected?.id ?? (typeof selected === "object" && selected?.id ? selected.id : null);
    try {
      await axios.post(
        `${base_url}/quick-orders/${id}/add-stock`,
        {
          stock_id: stockId,
          quantity: selected?.quantity || 1,
          detail_id: detailId,
          price: selected?.price ?? null,
        },
        getHeaders()
      );
      toast.info("Məhsul əlavə olundu", { autoClose: 1000 });
      if (!quickOrderId) setQuickOrderId(id);
      await fetchQuickOrder(id);
      setNoOrderModal(false);
    } catch (e) {
      toast.error(e.response?.data?.message || t("common.unknownError"));
    }
  };

  const handleRemoveStock2 = async (stockId, pivot_id, quantity) => {
    if (!quickOrderId) return;
    try {
      await axios.post(
        `${base_url}/quick-orders/${quickOrderId}/subtract-stock`,
        { stock_id: stockId, quantity: quantity || 1, pivotId: pivot_id, increase: false },
        getHeaders()
      );
      fetchQuickOrder();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomModal = async (item) => {
    const selectedStock = stocks.find((s) => s.id === item.id);
    if (!selectedStock) return;
    setModalId(selectedStock.id);
    setModalData({
      name: selectedStock.name,
      desc: selectedStock.description || "",
      price: selectedStock.price,
    });
    setSelectedProduct({
      id: null,
      name: selectedStock.details?.length ? "" : selectedStock.name,
      price: selectedStock.price || 0,
      quantity: 1,
    });
    setNoOrderModal(true);
  };

  const closeModal = () => setNoOrderModal(false);

  const resetForNewSale = () => {
    setQuickOrderId(null);
    setName("");
    setPhone("");
    setAddress("");
    setMapsUrl("");
    setOrderDetails([]);
    setOdersIdMassa({});
    setTotalPrice({});
    setCheckedItems([]);
    setOpenRows({});
    setProductSearch("");
    setMobileView("menu");
  };

  const handlePaymentSuccess = () => {
    setHesabKes(false);
    resetForNewSale();
    toast.success(t("siparisler.saleComplete"));
    onComplete?.();
  };

  const handleDeleteOrder = async () => {
    if (!quickOrderId) {
      onBack?.();
      return;
    }
    try {
      await axios.delete(`${base_url}/quick-orders/${quickOrderId}`, getHeaders());
      onBack?.();
    } catch (e) {
      console.error(e);
    }
  };

  const calculateOverallTotal = () => totalPrice.total || 0;
  const calculateRemainingAmount = () => calculateOverallTotal() - (totalPrice.total_prepare || 0);

  const toggleRow = (id) => setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCheckboxChange = (item, e) => {
    const isChecked = e.target.checked;
    const normalized = {
      ...item,
      detail_id: item.detail_id || null,
      count: item.count || item.detail_id?.count,
      unit: item.unit || item.detail_id?.unit || "",
      type: item.type || "stock",
      name: item.name || "",
    };
    setCheckedItems((prev) =>
      isChecked ? [...prev, normalized] : prev.filter((i) => i.pivot_id !== normalized.pivot_id && i.id !== normalized.id)
    );
  };

  const handleIngredientChange = (index, value) => {
    setCheckedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, customIngredient: value } : item))
    );
  };

  const kicthenDataSend = () => {
    const kitchenContent = `<html><head><title>Mətbəx</title><style>
      body{font-family:Arial;margin:0;padding:0}.invoice{width:100mm;margin:5px auto;padding:3px;border:1px solid #000;font-size:10px}
      .table{width:100%;border-collapse:collapse}.table th,.table td{border:1px solid #000;padding:3px;text-align:left}
    </style></head><body><div class="invoice"><table class="table"><thead><tr><th>No</th><th>Ad</th><th>Miq.</th><th>Tərkib</th></tr></thead><tbody>
    ${checkedItems.map((item, i) => `<tr><td>${i + 1}</td><td>${item.name}${item.unit ? ` (${item.count} ${item.unit})` : ""}</td><td>${item.quantity}</td><td>${item.customIngredient || "—"}</td></tr>`).join("")}
    </tbody></table></div></body></html>`;
    const w = window.open("", "", "width=800,height=600");
    w.document.write(kitchenContent);
    w.document.close();
    w.print();
    setHandleModal(false);
  };

  const handlePrint = () => {
    const mapsUrlForQr = resolveReceiptMapsUrl(address, mapsUrl, fullAddress);
    const locationQrHtml = buildLocationQrHtml(mapsUrlForQr);
    const addressForPrint = escapeReceiptHtml(formatAddressForReceipt(address)).replace(/\n/g, "<br>");
    const isWebOrder = /\[Web sifariş\]/i.test(orderNote);
    const webBadge = isWebOrder
      ? '<p style="text-align:center;font-size:11px;background:#d1fae5;padding:4px 8px;border-radius:6px;margin:0 0 8px"><b>Web sifariş</b></p>'
      : "";

    const printContent = `<html><head><title>Sifariş</title><style>
      body{font-family:Arial}.container{max-width:650px;margin:auto;padding:10px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px}
    </style></head><body><div class="container">
    ${webBadge}
    <h2>Sifariş məlumatları</h2>
    <p><b>Müştəri:</b> ${escapeReceiptHtml(name)}</p>
    <p><b>Telefon:</b> ${escapeReceiptHtml(phone || "—")}</p>
    <p><b>Ünvan:</b> ${addressForPrint}</p>
    <table><thead><tr><th>Ad</th><th>Say</th><th>Məbləğ</th></tr></thead><tbody>
    ${orderDetails.map((item) => `<tr><td>${escapeReceiptHtml(item.name)}</td><td>${item.quantity}</td><td>${Number(item.price).toFixed(2)} ₼</td></tr>`).join("")}
    </tbody></table><p><b>Cəm:</b> ${calculateOverallTotal().toFixed(2)} ₼</p>
    ${locationQrHtml}
    <p style="text-align:center">${escapeReceiptHtml(fis || "")}</p></div></body></html>`;
    const w = window.open("", "", "height=600,width=800");
    w.document.write(printContent);
    w.document.close();
    w.print();
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("siparisler.locationUnsupported"));
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapsUrl(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`);
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
        toast.error(t("siparisler.locationError"));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (accessDenied) return <AccessDenied onClose={() => setAccessDenied(false)} />;

  const shellClass =
    mode === "overlay"
      ? "fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden"
      : "fixed inset-x-0 bottom-0 top-14 z-20 bg-slate-50 flex flex-col overflow-hidden";

  return (
    <>
      {mode === "overlay" && <ToastContainer />}
      <div className={shellClass}>
        <section className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Sol — sifariş */}
          <div
            className={`${
              mobileView === "order" ? "flex" : "hidden"
            } lg:flex w-full lg:w-[40%] xl:w-[40%] flex-col min-h-0 overflow-hidden px-3 sm:px-4 py-3 pb-24 lg:pb-3 lg:border-r lg:border-slate-200 bg-slate-50`}
          >
            <div className="shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 space-y-2 mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">{t("common.back")}</span>
                </button>
                <div className="flex-1 min-w-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-100">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {t("siparisler.quickSale")}
                  </div>
                  <div className="text-sm font-bold text-slate-800 truncate">
                    {displayName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerOpen((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                  title={t("siparisler.customerOptionalHint")}
                >
                  <User size={14} />
                  {customerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {customerOpen && (
                <>
                  <p className="text-xs text-slate-500">{t("siparisler.customerOptionalHint")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="relative">
                      <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={saveCustomerIfNeeded}
                        placeholder={t("siparisler.fullName")}
                        className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={saveCustomerIfNeeded}
                        placeholder={t("siparisler.phone")}
                        className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div className="relative sm:col-span-1">
                      <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onBlur={saveCustomerIfNeeded}
                        placeholder={t("siparisler.address")}
                        className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={sendLocation}
                      disabled={locLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-50 text-emerald-700"
                    >
                      {locLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                      GPS
                    </button>
                    {creating && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                  </div>
                </>
              )}

              {checkedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHandleModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold"
                >
                  <ChefHat size={16} />
                  Mətbəxə yazdır ({checkedItems.length})
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
              <OrderTable
                orderDetails={orderDetails}
                openRows={openRows}
                toggleRow={toggleRow}
                handleCheckboxChange={handleCheckboxChange}
                handleAddStock={handleAddStock}
                handleRemoveStock2={handleRemoveStock2}
                setPendingRemoveData={setPendingRemoveData}
                setShowPasswordScreen={setShowPasswordScreen}
                tableClassName="flex-1 min-h-0 max-h-none"
              />
            </div>

            <div className="shrink-0 mt-2 overflow-y-auto max-h-[28vh] lg:max-h-[32vh]">
              <PaymentSummary
                role={role}
                totalPrice={totalPrice}
                calculateOverallTotal={calculateOverallTotal}
                calculateRemainingAmount={calculateRemainingAmount}
                setOncedenodePopop={setOncedenodePopop}
                isPsClub={0}
                psPrice={[]}
                inputValue="0"
                handlePsTotalChange={() => {}}
                handlePsTotalBlur={() => {}}
                setHesabKes={setHesabKes}
                handlePrint={handlePrint}
                handleDeleteMasa={handleDeleteOrder}
                TotalPriceHesab={TotalPriceHesab}
                compact
              />
            </div>
          </div>

          {/* Sağ — menyu */}
          <div
            className={`${
              mobileView === "menu" ? "flex" : "hidden"
            } lg:flex w-full lg:w-[60%] xl:w-[60%] lg:flex-none flex-col min-w-0 min-h-0 overflow-hidden`}
          >
            <div className="flex-shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 pt-3 pb-3 space-y-2.5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t("siparisler.searchProduct")}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div
                className={`gap-1.5 -mx-1 px-1 pb-1 ${
                  isGroupsExpanded ? "flex flex-wrap" : "flex flex-nowrap overflow-x-auto"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setUrunType(0);
                    toggleGroupsExpanded();
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    urunType === 0 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {t("common.all")}
                </button>
                {stockGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setUrunType(g.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      urunType === g.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-3 pb-24 lg:pb-4 relative">
              {isStocksLoading && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {t("common.loading")}
                </div>
              )}
              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 transition-opacity ${isStocksLoading ? "opacity-50" : ""}`}>
                {(() => {
                  const q = productSearch.trim().toLowerCase();
                  const list = q ? stocks.filter((s) => s.name?.toLowerCase().includes(q)) : stocks;
                  if (list.length === 0) {
                    return (
                      <div className="col-span-full bg-white rounded-2xl border py-10 text-center text-slate-500">
                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t("siparisler.empty")}</p>
                      </div>
                    );
                  }
                  return list.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCustomModal(item)}
                      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden text-left flex flex-col"
                    >
                      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                        {item.image ? (
                          <img
                            src={replaceImage(item.image)}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-slate-300">
                            <Utensils size={28} />
                          </div>
                        )}
                        <div className="absolute top-1.5 right-1.5 bg-white/95 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg shadow">
                          {Number(item.price).toFixed(2)} ₼
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-medium text-slate-700 line-clamp-2">{item.name}</p>
                      </div>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Mobil tab */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-2 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={() => setMobileView("menu")}
            className={`flex flex-col items-center py-2.5 text-xs font-semibold ${mobileView === "menu" ? "text-indigo-600" : "text-slate-500"}`}
          >
            <Utensils size={20} />
            Menyu
          </button>
          <button
            type="button"
            onClick={() => setMobileView("order")}
            className={`relative flex flex-col items-center py-2.5 text-xs font-semibold ${mobileView === "order" ? "text-indigo-600" : "text-slate-500"}`}
          >
            <ShoppingBag size={20} />
            Sifariş
            {orderDetails.length > 0 && (
              <span className="absolute top-1 right-[calc(50%-20px)] min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {orderDetails.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {showPasswordScreen && pendingRemoveData && quickOrderId && (
        <PasswordScreenFour
          pendingRemoveData={pendingRemoveData}
          quickOrderId={quickOrderId}
          fetchQuickOrders={fetchQuickOrder}
          onClose={() => {
            setShowPasswordScreen(false);
            setPendingRemoveData(null);
          }}
        />
      )}

      {oncedenodePopop && (
        <OncedenPopop
          name={name}
          odersIdMassa={odersIdMassa}
          setrefreshfetch={setRefreshFetch}
          setoncedenodePopop={setOncedenodePopop}
        />
      )}

      {orderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-3" onClick={closeModal}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
              <div className="pr-10">
                <div className="text-[10px] uppercase tracking-wider text-indigo-100 font-semibold">Məhsul əlavə et</div>
                <h3 className="text-lg font-bold truncate">{modalData?.name}</h3>
                {modalData?.desc && (
                  <p className="text-xs text-indigo-100 mt-0.5 line-clamp-3 whitespace-pre-wrap">{modalData.desc}</p>
                )}
              </div>
              <button type="button" onClick={closeModal} className="absolute right-3 top-3 p-1.5 rounded-lg bg-white/20">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {modalData?.desc && (
                <div className="mb-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Tərkib</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{modalData.desc}</p>
                </div>
              )}
              {stocks.find((s) => s.id === modalId)?.details?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Variant seçin</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {stocks
                      .find((s) => s.id === modalId)
                      ?.details.map((item) => {
                        const isSelected = selectedProduct?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setSelectedProduct({ id: item.id, name: item.name || "", price: item.price, quantity: 1 })
                            }
                            className={`border rounded-xl p-3 text-center transition-all ${
                              isSelected
                                ? "bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-600 text-white shadow-md"
                                : "bg-white border-slate-200 hover:border-indigo-300"
                            }`}
                          >
                            <div className={`text-xs font-semibold ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                              {item.count} {item.unit}
                            </div>
                            <div className="text-base font-bold mt-1">{Number(item.price).toFixed(2)} ₼</div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Miqdar</div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct((p) => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                    className="w-11 h-11 rounded-full bg-white border grid place-items-center"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="text-3xl font-bold">{selectedProduct?.quantity}</div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct((p) => ({ ...p, quantity: p.quantity + 1 }))}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white grid place-items-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex justify-between bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                <span className="text-xs font-semibold text-slate-500">Ümumi</span>
                <span className="text-xl font-bold text-indigo-700">
                  {((selectedProduct?.price || modalData?.price || 0) * selectedProduct.quantity).toFixed(2)} ₼
                </span>
              </div>
            </div>
            <div className="p-4 border-t">
              <button
                type="button"
                onClick={() => {
                  const stock = stocks.find((s) => s.id === modalId);
                  if (stock) handleAddStock(stock.id, selectedProduct);
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl"
              >
                <Plus size={18} />
                Sifarişə əlavə et
              </button>
            </div>
          </div>
        </div>
      )}

      {handleModalMetbex && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <button type="button" onClick={() => setHandleModal(false)} className="absolute right-3 top-3 p-2 rounded-full bg-red-500 text-white">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold mb-4">Mətbəx sifarişi</h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {checkedItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-2">
                  <div className="text-sm font-medium mb-1">{item.name}</div>
                  <input
                    type="text"
                    placeholder="Xüsusi qeyd..."
                    value={item.customIngredient || ""}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={kicthenDataSend} className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
              Mətbəxə göndər
            </button>
          </div>
        </div>
      )}

      {HesabKes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t("siparisler.closeBill")}</h3>
              <button type="button" onClick={() => setHesabKes(false)} className="text-2xl text-slate-400">&times;</button>
            </div>
            <div className="p-5 max-h-[80vh] overflow-y-auto">
              <HesapKesSip
                orderId={odersIdMassa}
                totalAmount={calculateRemainingAmount()}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickOrderPos;
