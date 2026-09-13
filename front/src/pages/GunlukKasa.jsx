import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { pageTitle } from "../config/branding";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import AccessDenied from "../components/AccessDenied";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import PasswordScreen from "../components/ScreenPassword";
import { useLanguage } from "../i18n/LanguageContext";
import { toast } from "react-toastify";
import {
  Wallet,
  Banknote,
  CreditCard,
  Receipt,
  Search,
  RefreshCw,
  Filter,
  Printer,
  FileSpreadsheet,
  FileText,
  Eye,
  Trash2,
  X,
  Loader2,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  LockOpen,
  Lock,
} from "lucide-react";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const formatDuration = (days, hours, minutes) => {
  const parts = [];
  if (parseInt(days, 10) > 0) parts.push(`${days} g`);
  if (parseInt(hours, 10) > 0) parts.push(`${hours} st`);
  if (parseInt(minutes, 10) > 0) parts.push(`${minutes} d`);
  return parts.join(" ") || "1 d";
};

const formatMoney = (n) => `${Number(n || 0).toFixed(2)} ₼`;

const handlePrintReceipt = (modalData, dataTotal) => {
  if (!modalData) return;
  const restoranName = modalData.restoranName || "Restoran";
  const tableName = modalData.order_name || "—";
  const fis = modalData.fis || "";
  const orderDetails = modalData.items || [];
  const totalPrice = {
    total: Number(modalData.total_amount) || 0,
    total_prepare: Number(dataTotal.total_prepare) || 0,
    kalan: Number(dataTotal.kalan) || 0,
  };
  const now = new Date();
  const printContent = `<html><head><title>Qəbz</title><style>
    body{font-family:Arial;margin:0;padding:0}.invoice{width:100mm;margin:5px auto;padding:1px;font-size:10px}
    .header{text-align:center;margin-bottom:5px}.table{width:100%;border-collapse:collapse}
    .table th,.table td{border:1px solid #000;padding:3px;text-align:left}.total{text-align:right;font-weight:bold;margin-top:5px}
  </style></head><body><div class="invoice"><div class="header"><h1>${restoranName}</h1><h2>${tableName}</h2>
  <p>${now.toLocaleString()}</p></div><table class="table"><thead><tr><th>No</th><th>Ad</th><th>Miq.</th><th>Məbləğ</th></tr></thead><tbody>
  ${orderDetails.map((item, i) => `<tr><td>${i + 1}</td><td>${item.name}</td><td>${item.quantity}</td><td>${item.price}</td></tr>`).join("")}
  </tbody></table><div class="total"><p>CƏM: ${totalPrice.total.toFixed(2)} ₼</p><strong>${fis}</strong></div></div></body></html>`;
  const w = window.open("", "", "width=800,height=600");
  w.document.write(printContent);
  w.document.close();
  w.print();
};

function GunlukKasa() {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [dataTotal, setDataTotal] = useState({});
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openRows, setOpenRows] = useState({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerSession, setRegisterSession] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerToggling, setRegisterToggling] = useState(false);

  const paymentLabel = (type) => {
    if (type === "cash") return t("gunlukKasa.cash");
    if (type === "bank") return t("gunlukKasa.card");
    if (type === "customer_balance") return t("gunlukKasa.customerBalance");
    return t("gunlukKasa.paymentSplit");
  };

  const paymentBadgeClass = (type) => {
    if (type === "cash") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (type === "bank") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";
    if (type === "customer_balance") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  };

  const fetchKasa = useCallback((overrides = {}) => {
    setLoading(true);
    const params = new URLSearchParams();
    const sd = overrides.startDate ?? startDate;
    const ed = overrides.endDate ?? endDate;
    const st = overrides.startTime ?? startTime;
    const et = overrides.endTime ?? endTime;
    const pt = overrides.paymentType ?? paymentType;

    if (sd) params.append("open_date", st ? `${sd} ${st}` : sd);
    if (ed) params.append("close_date", et ? `${ed} ${et}` : ed);
    if (pt) params.append("type", pt);

    axios
      .get(`${base_url}/payments?${params.toString()}`, getHeaders())
      .then((response) => {
        const sorted = (response.data.payments || [])
          .map((item) => ({
            ...item,
            duration: formatDuration(item.days_taken, item.hours_taken, item.minutes_taken),
          }))
          .sort((a, b) => new Date(b.open_date) - new Date(a.open_date));
        setData(sorted);
        setDataTotal({
          totalKasa: response.data.total_amount,
          totalCash: response.data.total_cash,
          totalBank: response.data.total_bank,
        });
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          if (error.response.data?.message?.includes("active restaurant")) toast.error(t("gunlukKasa.loadError"));
          else if (error.response.data?.message === "Forbidden") setAccessDenied(true);
        } else {
          toast.error(t("gunlukKasa.loadError"));
        }
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, startTime, endTime, paymentType, t]);

  const fetchRegisterStatus = useCallback(() => {
    setRegisterLoading(true);
    return axios
      .get(`${base_url}/cash-register/status`, getHeaders())
      .then((res) => {
        setRegisterOpen(Boolean(res.data.open));
        setRegisterSession(res.data.session || null);
        return res.data;
      })
      .catch(() => {
        setRegisterOpen(false);
        setRegisterSession(null);
        return null;
      })
      .finally(() => setRegisterLoading(false));
  }, []);

  const applySessionDateFilter = useCallback((openedAt) => {
    if (!openedAt) return;
    const d = new Date(openedAt);
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    setStartDate(date);
    setStartTime(time);
    setEndDate("");
    setEndTime("");
    fetchKasa({ startDate: date, startTime: time, endDate: "", endTime: "" });
  }, [fetchKasa]);

  const handleRegisterOpen = async () => {
    setRegisterToggling(true);
    try {
      const res = await axios.post(`${base_url}/cash-register/open`, {}, getHeaders());
      setRegisterOpen(true);
      setRegisterSession(res.data.session);
      toast.success(t("gunlukKasa.registerOpened"));
      applySessionDateFilter(res.data.session?.opened_at);
    } catch (err) {
      const msg = err.response?.data?.message || t("gunlukKasa.registerToggleError");
      toast.error(msg);
      fetchRegisterStatus();
    } finally {
      setRegisterToggling(false);
    }
  };

  const handleRegisterClose = async () => {
    if (!window.confirm(t("gunlukKasa.registerCloseConfirm"))) return;
    setRegisterToggling(true);
    try {
      const res = await axios.post(`${base_url}/cash-register/close`, {}, getHeaders());
      setRegisterOpen(false);
      setRegisterSession(null);
      const s = res.data.session?.summary;
      toast.success(
        `${t("gunlukKasa.registerClosed")} — ${formatMoney(s?.total)} (${s?.count || 0} ${t("gunlukKasa.statCount").toLowerCase()})`
      );
      fetchKasa();
    } catch (err) {
      const msg = err.response?.data?.message || t("gunlukKasa.registerToggleError");
      toast.error(msg);
      fetchRegisterStatus();
    } finally {
      setRegisterToggling(false);
    }
  };

  useEffect(() => {
    fetchRegisterStatus().then((status) => {
      if (status?.open && status.session?.opened_at) {
        const d = new Date(status.session.opened_at);
        const date = d.toISOString().slice(0, 10);
        const time = d.toTimeString().slice(0, 5);
        setStartDate(date);
        setStartTime(time);
        fetchKasa({ startDate: date, startTime: time });
      } else {
    fetchKasa();
      }
    });
  }, []);

  useEffect(() => {
    if (modalData) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [modalData]);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setPaymentType("");
    setSearch("");
    fetchKasa({ startDate: "", endDate: "", startTime: "", endTime: "", paymentType: "" });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (d) =>
        d.order_name?.toLowerCase().includes(q) ||
        d.user_name?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((d) => ({
        [t("gunlukKasa.tableOrName")]: d.order_name,
        [t("gunlukKasa.opened")]: d.open_date,
        [t("gunlukKasa.closed")]: d.close_date,
        [t("gunlukKasa.duration")]: d.duration,
        [t("gunlukKasa.amount")]: d.total_amount,
        [t("gunlukKasa.paymentType")]: paymentLabel(d.type),
        [t("gunlukKasa.employee")]: d.user_name,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kasa");
    XLSX.writeFile(wb, "kasa_raporu.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(t("gunlukKasa.title"), 14, 16);
    doc.autoTable({
      head: [[
        t("gunlukKasa.tableOrName"),
        t("gunlukKasa.opened"),
        t("gunlukKasa.closed"),
        t("gunlukKasa.duration"),
        t("gunlukKasa.amount"),
        t("gunlukKasa.paymentType"),
        t("gunlukKasa.employee"),
      ]],
      body: filtered.map((d) => [
      d.order_name,
      d.open_date,
      d.close_date,
      d.duration,
      d.total_amount,
        paymentLabel(d.type),
      d.user_name,
      ]),
      startY: 24,
    });
    doc.save("kasa_raporu.pdf");
  };

  const printReport = () => {
    const printContent = `<html><head><title>${t("gunlukKasa.title")}</title><style>
      body{font-family:Arial}.container{max-width:800px;margin:auto}table{width:100%;border-collapse:collapse}
      th,td{padding:8px;border:1px solid #000;text-align:left}th{background:#f4f4f4}
    </style></head><body><div class="container"><h1>${t("gunlukKasa.title")}</h1><table><thead><tr>
    <th>${t("gunlukKasa.tableOrName")}</th><th>${t("gunlukKasa.opened")}</th><th>${t("gunlukKasa.closed")}</th>
    <th>${t("gunlukKasa.duration")}</th><th>${t("gunlukKasa.amount")}</th><th>${t("gunlukKasa.paymentType")}</th><th>${t("gunlukKasa.employee")}</th>
    </tr></thead><tbody>${filtered.map((item) => `<tr><td>${item.order_name}</td><td>${item.open_date}</td><td>${item.close_date}</td><td>${item.duration}</td><td>${item.total_amount}</td><td>${paymentLabel(item.type)}</td><td>${item.user_name}</td></tr>`).join("")}
    </tbody></table><h3>${t("gunlukKasa.statTotal")}: ${formatMoney(dataTotal.totalKasa)} | ${t("gunlukKasa.statCash")}: ${formatMoney(dataTotal.totalCash)} | ${t("gunlukKasa.statBank")}: ${formatMoney(dataTotal.totalBank)}</h3></div></body></html>`;
    const w = window.open("", "", "height=600,width=800");
    w.document.write(printContent);
    w.document.close();
    w.print();
  };

  const handleDelete = (orderId) => {
    if (!window.confirm(t("gunlukKasa.deleteConfirm"))) return;
    axios
      .delete(`${base_url}/order/${orderId}/payments`, getHeaders())
      .then(() => {
        toast.success(t("gunlukKasa.deleted"));
        setModalData(null);
        fetchKasa();
      })
      .catch(() => toast.error(t("common.unknownError")));
  };

  const toggleRow = (index) => setOpenRows((prev) => ({ ...prev, [index]: !prev[index] }));

  const modalContent = modalData ? (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-full sm:max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start gap-3 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{modalData.order_name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{formatMoney(modalData.total_amount)}</p>
          </div>
          <button type="button" onClick={() => setModalData(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <span className="text-xs text-slate-500 block">{t("gunlukKasa.opened")}</span>
              <span className="font-medium">{modalData.open_date}</span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <span className="text-xs text-slate-500 block">{t("gunlukKasa.closed")}</span>
              <span className="font-medium">{modalData.close_date}</span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <span className="text-xs text-slate-500 block">{t("gunlukKasa.duration")}</span>
              <span className="font-medium">{modalData.duration}</span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <span className="text-xs text-slate-500 block">{t("gunlukKasa.employee")}</span>
              <span className="font-medium">{modalData.user_name}</span>
            </div>
          </div>
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${paymentBadgeClass(modalData.type)}`}>
            {paymentLabel(modalData.type)}
          </span>

          <div>
            <h4 className="text-sm font-semibold mb-2">{t("gunlukKasa.orders")}</h4>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">{t("gunlukKasa.itemName")}</th>
                    <th className="px-3 py-2 text-center">{t("gunlukKasa.qty")}</th>
                    <th className="px-3 py-2 text-right">{t("gunlukKasa.price")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {modalData.items?.length ? (
                    modalData.items.map((item, index) => (
                      <React.Fragment key={`${item.name}-${index}`}>
                        <tr
                          className={item.components ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""}
                          onClick={() => item.components && toggleRow(index)}
                        >
                          <td className="px-3 py-2 font-medium">
                            {item.name}
                            {item.components && (openRows[index] ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />)}
                          </td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatMoney(item.price)}</td>
                        </tr>
                        {item.components && openRows[index] &&
                          item.components.map((c, cIdx) => (
                            <tr key={cIdx} className="text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                              <td className="px-3 py-1 pl-6">↳ {c.name}</td>
                              <td className="px-3 py-1 text-center">{c.quantity}</td>
                              <td />
                            </tr>
                          ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-slate-400">{t("gunlukKasa.empty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePrintReceipt(modalData, dataTotal)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            <Printer size={16} /> {t("gunlukKasa.printReceipt")}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(modalData.order_id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100"
          >
            <Trash2 size={16} /> {t("common.delete")}
          </button>
          <button
            type="button"
            onClick={() => setModalData(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (accessDenied) return <AccessDenied onClose={() => setAccessDenied(false)} />;

  return (
    <>
      <PasswordScreen category="kassa" />
      <Helmet>
        <title>{pageTitle(t("gunlukKasa.title"))}</title>
      </Helmet>

      <section className="p-3 sm:p-4 max-w-[1400px] mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Wallet size={24} className="text-indigo-600" />
              {t("gunlukKasa.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("gunlukKasa.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                fetchKasa();
                fetchRegisterStatus();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {t("masalar.refresh")}
            </button>
            <button type="button" onClick={exportToExcel} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-white text-sm">
              <FileSpreadsheet size={16} /> {t("gunlukKasa.exportExcel")}
            </button>
            <button type="button" onClick={exportToPDF} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-700 text-white text-sm">
              <FileText size={16} /> {t("gunlukKasa.exportPdf")}
            </button>
            <button type="button" onClick={printReport} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm">
              <Printer size={16} /> {t("gunlukKasa.reportPrint")}
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            registerOpen
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`shrink-0 p-2.5 rounded-xl ${
                registerOpen
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {registerOpen ? <LockOpen size={22} /> : <Lock size={22} />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {registerOpen ? t("gunlukKasa.registerIsOpen") : t("gunlukKasa.registerIsClosed")}
              </p>
              {registerOpen && registerSession && (
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                  <p>
                    {t("gunlukKasa.registerOpenedAt")}:{" "}
                    {new Date(registerSession.opened_at).toLocaleString()}
                    {registerSession.user_name ? ` · ${registerSession.user_name}` : ""}
                  </p>
                  {registerSession.summary && (
                    <p>
                      {t("gunlukKasa.registerSessionTotal")}: {formatMoney(registerSession.summary.total)}
                      {" · "}
                      {t("gunlukKasa.statCash")}: {formatMoney(registerSession.summary.cash)}
                      {" · "}
                      {t("gunlukKasa.statBank")}: {formatMoney(registerSession.summary.bank)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={registerOpen ? handleRegisterClose : handleRegisterOpen}
            disabled={registerLoading || registerToggling}
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 min-w-[160px] ${
              registerOpen
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {(registerLoading || registerToggling) && <Loader2 size={18} className="animate-spin" />}
            {!registerLoading && !registerToggling && (registerOpen ? <Lock size={18} /> : <LockOpen size={18} />)}
            {registerOpen ? t("gunlukKasa.registerClose") : t("gunlukKasa.registerOpen")}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t("gunlukKasa.statTotal"), value: formatMoney(dataTotal.totalKasa), icon: Wallet, color: "indigo" },
            { label: t("gunlukKasa.statCash"), value: formatMoney(dataTotal.totalCash), icon: Banknote, color: "emerald" },
            { label: t("gunlukKasa.statBank"), value: formatMoney(dataTotal.totalBank), icon: CreditCard, color: "violet" },
            { label: t("gunlukKasa.statCount"), value: filtered.length, icon: Receipt, color: "amber" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <s.icon size={14} />
                {s.label}
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Filter size={16} /> {t("common.filter")}
            </h3>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("gunlukKasa.start")}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm mb-2 dark:bg-slate-800" />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("gunlukKasa.end")}</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm mb-2 dark:bg-slate-800" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("gunlukKasa.paymentType")}</label>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800">
                <option value="">{t("common.all")}</option>
                <option value="cash">{t("gunlukKasa.cash")}</option>
                <option value="bank">{t("gunlukKasa.card")}</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={fetchKasa} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                {t("common.filter")}
              </button>
              <button type="button" onClick={resetFilters} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                {t("common.clear")}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("gunlukKasa.searchPlaceholder")}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-16 text-slate-400">{t("gunlukKasa.empty")}</p>
            ) : (
              <>
                <div className="md:hidden p-3 space-y-3">
                  {filtered.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{item.order_name}</span>
                        <span className="font-bold text-indigo-600">{formatMoney(item.total_amount)}</span>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${paymentBadgeClass(item.type)}`}>
                        {paymentLabel(item.type)}
                      </span>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p className="flex items-center gap-1"><Clock size={12} /> {item.open_date} → {item.close_date}</p>
                        <p className="flex items-center gap-1"><User size={12} /> {item.user_name}</p>
            </div>
                <button
                        type="button"
                        onClick={() => setModalData(item)}
                        className="w-full mt-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 text-sm font-medium inline-flex items-center justify-center gap-1"
                      >
                        <Eye size={14} /> {t("gunlukKasa.detail")}
                </button>
              </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">{t("gunlukKasa.tableOrName")}</th>
                        <th className="px-4 py-3 text-left">{t("gunlukKasa.opened")}</th>
                        <th className="px-4 py-3 text-left">{t("gunlukKasa.closed")}</th>
                        <th className="px-4 py-3 text-left">{t("gunlukKasa.duration")}</th>
                        <th className="px-4 py-3 text-right">{t("gunlukKasa.amount")}</th>
                        <th className="px-4 py-3 text-left">{t("gunlukKasa.paymentType")}</th>
                        <th className="px-4 py-3 text-left">{t("gunlukKasa.employee")}</th>
                        <th className="px-4 py-3 text-center">{t("gunlukKasa.detail")}</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filtered.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{item.order_name}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.open_date}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.close_date}</td>
                          <td className="px-4 py-3 text-slate-600">{item.duration}</td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-600">{formatMoney(item.total_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${paymentBadgeClass(item.type)}`}>
                              {paymentLabel(item.type)}
                            </span>
                        </td>
                          <td className="px-4 py-3 text-slate-600">{item.user_name}</td>
                          <td className="px-4 py-3 text-center">
                          <button
                              type="button"
                              onClick={() => setModalData(item)}
                              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            >
                              <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </div>
      </section>

      {typeof document !== "undefined" && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}

export default GunlukKasa;
