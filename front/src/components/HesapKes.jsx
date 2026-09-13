import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AccessDenied from "./AccessDenied";
import { base_url } from "../api/index";
import { useDispatch, useSelector } from "react-redux";
import { fetchTableOrderStocks } from "../redux/stocksSlice";
import Modal from "../components/HesabKesModal";
import AmountCalculator from "./AmountCalculator";
import HesabKesStitchLayout from "./hesabKes/HesabKesStitchLayout";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** orderId bəzən { id, total_price, total_prepayment } obyekti kimi gəlir (MasaSiparis / Modal). */
function resolveOrderId(orderId, ordersList) {
  const fallback = ordersList?.[0]?.order_id ?? null;
  if (orderId == null || orderId === "") return fallback;
  if (typeof orderId === "object") {
    return orderId.id ?? orderId.order_id ?? fallback;
  }
  return orderId;
}

function resolvePrepaidAmount(prepaidAmount, orderId) {
  if (prepaidAmount != null && prepaidAmount !== "") {
    const n = Number(prepaidAmount);
    if (!Number.isNaN(n)) return n;
  }
  if (orderId && typeof orderId === "object") {
    return Number(orderId.total_prepayment) || 0;
  }
  return 0;
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm lg:text-base text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none";
const labelClass =
  "text-xs lg:text-sm font-semibold uppercase tracking-wide text-slate-500 mb-1 block";

function HesapKes({
  orderStocks,
  orderId,
  totalAmount,
  prepaidAmount = 0,
  setHesabKes,
  onPaymentSuccess,
  fullPage = false,
  tableName = "",
  onCancel,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isCariMusteriSelected, setIsCariMusteriSelected] = useState(false);
  const [isParcaParcaOde, setIsParcaParcaOde] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [discount, setDiscount] = useState("");
  const [sum, setSum] = useState(Array(numberOfPeople).fill(0));
  const [selectedPaymentType, setSelectedPaymentType] = useState(fullPage ? "pesin" : "");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [alinanMebleg, setAlinanMebleg] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { allItems, orders } = useSelector((state) => state.stocks);

  const resolvedOrderId = resolveOrderId(orderId, orders);
  const resolvedPrepaid = resolvePrepaidAmount(prepaidAmount, orderId);

  // ✅ Qəbz üçün print ref
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // ✅ Endirim + Ön ödəniş düşülmüş yekun
  const discountedTotalRaw = totalAmount * (1 - parseFloat(discount || 0) / 100);
  const discountedTotal = Math.max(
    0,
    Number((discountedTotalRaw - Number(resolvedPrepaid || 0)).toFixed(2))
  );

  // 🟡 Qalıq məbləğ (nağd modal üçün)
  const qaliqMebleg =
    alinanMebleg !== "" ? Number((parseFloat(alinanMebleg || 0) - discountedTotal).toFixed(2)) : null;

  useEffect(() => {
    dispatch(fetchTableOrderStocks(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (isCariMusteriSelected) {
      axios
        .get(`${base_url}/customers`, getHeaders())
        .then((res) => setCustomerOptions(res.data))
        .catch((err) => console.error("Error fetching customers:", err));
    }
  }, [isCariMusteriSelected]);

  useEffect(() => {
    if (isParcaParcaOde) {
      updateSumArray(numberOfPeople);
    }
  }, [discount, numberOfPeople, isParcaParcaOde]); // eslint-disable-line

  useEffect(() => {
    if (!fullPage) return;
    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      const inField = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
      if (e.key === "Escape" && typeof onCancel === "function") {
        onCancel();
      } else if (e.key === "Enter" && !inField && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("hesab-kes-form")?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullPage, onCancel]);

  // ✅ Ödəniş tipi seçimi
  const handlePaymentTypeChange = (type) => {
    setSelectedPaymentType(type);
    setIsCariMusteriSelected(type === "musteriye-aktar");
    setIsParcaParcaOde(type === "parca-ode");
    if (type === "parca-ode") {
      setNumberOfPeople(2);
      updateSumArray(2);
    } else {
      // hissə-hissə deyilsə, bölünməyi sıfırla
      setNumberOfPeople(0);
      setSum([]);
    }
    if (type === "pesin" && !fullPage) {
      setShowCashModal(true);
    }
    if (type !== "pesin") {
      setAlinanMebleg("");
    }
  };

  // ✅ Hissə-hissə bölünmə
  const updateSumArray = (peopleCount) => {
    const base = Math.floor((discountedTotal / peopleCount) * 100) / 100;
    const arr = new Array(peopleCount).fill(base);
    const distributed = base * peopleCount;
    if (distributed < discountedTotal) {
      arr[peopleCount - 1] = Number((arr[peopleCount - 1] + (discountedTotal - distributed)).toFixed(2));
    }
    setSum(arr);
  };

  const handleNumberOfPeopleChange = (newNumber) => {
    setNumberOfPeople(newNumber);
    updateSumArray(newNumber);
  };

  const handleSumChange = (index, value) => {
    const newSum = [...sum];
    newSum[index] = parseFloat(value) || 0;
    setSum(newSum);
  };

  const totalSum = sum.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const sumMessage =
    isParcaParcaOde && totalSum !== discountedTotal
      ? totalSum > discountedTotal
        ? "Toplam Məbləğ aşıldı!"
        : `Toplam Məbləğ eksik! ${Math.abs(discountedTotal - totalSum).toFixed(2)} eksik`
      : "";

  // ✅ Çap – sadə print (mövcud layoutdan)
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const finalAmount = Number(totalAmount || 0) - Number(resolvedPrepaid || 0);
      if (isNaN(finalAmount)) {
        alert("Ödəniş məlumatları düzgün deyil!");
        return;
      }
      // İstəsən burada serverə qəbz loglama API-si də ata bilərsən
      // await axios.post(`${base_url}/orders/${orders[0]?.order_id}/receipt`, {...}, getHeaders());

      // Sadə print: yalnız qəbz hissəsini çap etmək üçün:
      if (printRef.current) {
        const printContents = printRef.current.innerHTML;
        const win = window.open("", "PRINT", "height=650,width=900,top=100,left=150");
        win.document.write(`
          <html>
            <head>
              <title>Qəbz</title>
              <style>
                body { font-family: sans-serif; padding: 16px; }
                .row { display: flex; justify-content: space-between; margin: 6px 0; }
                .muted { color: #6b7280; font-size: 12px; }
                .title { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
                .hr { border-top: 1px dashed #e5e7eb; margin: 10px 0; }
              </style>
            </head>
            <body>${printContents}</body>
          </html>
        `);
        win.document.close();
        win.focus();
        win.print();
        win.close();
      } else {
        // Bütün səhifəni çap et
        window.print();
      }
    } catch (err) {
      console.error("Qəbz çapında xəta:", err);
      alert("Qəbz çapı zamanı xəta baş verdi!");
    } finally {
      setIsPrinting(false);
    }
  };

  // ✅ Ödənişi göndər
  const handleSubmit = async (event, forceSubmit = false) => {
    if (event?.preventDefault) event.preventDefault();

    if (!selectedPaymentType) {
      toast.warn("Zəhmət olmasa ödəniş növü seçin.", { position: "top-center" });
      return;
    }

    if (discountedTotal <= 0) {
      toast.warn("İndirimli məbləğ sıfır və ya mənfi ola bilməz!", { position: "top-center" });
      return;
    }

    if (selectedPaymentType === "parca-ode" && sum.some((amount) => amount <= 0)) {
      toast.warn("Bütün hissələr üçün etibarlı məbləğlər daxil edin.", { position: "top-center" });
      return;
    }

    if (selectedPaymentType === "musteriye-aktar" && !selectedCustomerId) {
      toast.warn('Zəhmət olmasa "Cari müştəriyə köçür" üçün müştəri seçin.', { position: "top-center" });
      return;
    }

    const mappedItems = (allItems || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const paymentData = {
      discount: parseFloat(discount) || 0,
      received_amount: parseFloat(alinanMebleg) || 0,
      remaining_amount: qaliqMebleg !== null ? parseFloat(qaliqMebleg.toFixed(2)) : 0,
      total_amount: parseFloat(Number(totalAmount || 0).toFixed(2)),
      discounted_total: parseFloat(Number(discountedTotal || 0).toFixed(2)),
      prepaid_amount: parseFloat(Number(resolvedPrepaid || 0).toFixed(2)), // ✅ ön ödəniş
      shares: [],
    };

    if (selectedPaymentType === "parca-ode") {
      paymentData.shares = sum.map((amount) => ({
        type: "cash",
        amount: parseFloat(amount),
        customer_id: null,
        items: mappedItems,
      }));
    } else {
      paymentData.shares.push({
        type:
          selectedPaymentType === "pesin"
            ? "cash"
            : selectedPaymentType === "bank-havale"
            ? "bank"
            : "customer_balance",
        amount: parseFloat(Number(discountedTotal || 0).toFixed(2)),
        customer_id: selectedCustomerId || null,
        items: mappedItems,
      });
    }

    // 🛑 Nağd ödəniş zamanı məbləğ yoxlaması (forceSubmit = bypass)
    if (!forceSubmit && selectedPaymentType === "pesin" && parseFloat(alinanMebleg || 0) < discountedTotal) {
      toast.warn("Müştəridən alınan məbləğ kifayət etmir!", { position: "top-center" });
      return;
    }

    if (!resolvedOrderId) {
      toast.error("Sifariş tapılmadı — səhifəni yeniləyin.", {
        position: "top-center",
      });
      return;
    }

    if (isSubmitting) return; // ikiqat submit qorumasi
    setIsSubmitting(true);
    try {
      await axios.post(
        `${base_url}/order/${resolvedOrderId}/payments`,
        paymentData,
        getHeaders()
      );

      toast.success("Ödəniş uğurla icra olundu", {
        position: "top-center",
        autoClose: 1200,
      });

      // Masa ilə bağlı localStorage açarlarını təmizlə (PS timer və s.)
      try {
        localStorage.removeItem(`table_${id}_isExpired`);
        localStorage.removeItem(`table_${id}_endTime`);
        localStorage.removeItem(`masa_siparis_${id}_openPsModal`);
        localStorage.removeItem(`masa_siparis_${id}_openPsSettings`);
      } catch (_) {}

      if (typeof setHesabKes === "function") setHesabKes(false);

      if (typeof onPaymentSuccess === "function") {
        onPaymentSuccess();
      } else {
        navigate("/masalar", { replace: true });
      }
    } catch (error) {
      setIsSubmitting(false);
      if (error?.response?.status === 403 && error?.response?.data?.message === "Forbidden") {
        setAccessDenied(true);
      } else {
        console.error("Error submitting payment:", error);
        toast.error("Ödənişi emal edərkən xəta baş verdi", {
          position: "top-center",
        });
      }
    }
  };

  if (accessDenied) {
    return (
      <AccessDenied
        onClose={() => {
          setAccessDenied(false);
          if (fullPage && typeof onCancel === "function") onCancel();
          else if (typeof setHesabKes === "function") setHesabKes(false);
        }}
      />
    );
  }

  const quickAmountButtons = (
    <>
      <button
        type="button"
        className={`rounded-xl bg-emerald-600 text-white py-2.5 px-2 text-xs lg:text-sm font-bold shadow-md hover:bg-emerald-700 active:bg-emerald-800 touch-manipulation whitespace-nowrap ${fullPage ? "col-span-2" : ""}`}
        onClick={() => setAlinanMebleg(String(discountedTotal))}
      >
        {fullPage ? "Dəqiq" : "Dəqiq məbləğ"}
      </button>
      {[50, 100, 200].map((amt) => (
        <button
          key={amt}
          type="button"
          className="rounded-xl border-2 border-emerald-200 bg-white py-2.5 text-sm lg:text-base font-bold text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 touch-manipulation"
          onClick={() => setAlinanMebleg(String(amt))}
        >
          {fullPage ? amt : `${amt} ₼`}
        </button>
      ))}
    </>
  );

  const changeDisplay =
    qaliqMebleg !== null ? (
      <div
        className={`rounded-2xl px-4 py-4 text-center w-full h-full min-h-[5.5rem] flex flex-col justify-center ${
          qaliqMebleg < 0 ? "bg-red-600 text-white shadow-md" : "bg-emerald-600 text-white shadow-md"
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-widest">
          {qaliqMebleg < 0 ? "Çatışmayan məbləğ" : "Para üstü"}
        </p>
        <p className="font-mono text-3xl sm:text-4xl font-bold tabular-nums mt-1 tracking-tight">
          {Math.abs(qaliqMebleg).toFixed(2)} ₼
        </p>
      </div>
    ) : null;

  const cashSection =
    selectedPaymentType === "pesin" ? (
      fullPage ? (
        <div className="w-full flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 text-center shadow-md">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Ödəniləcək</p>
              <p className="font-mono text-3xl sm:text-4xl font-bold tabular-nums mt-1">
                {Number(discountedTotal || 0).toFixed(2)} ₼
              </p>
            </div>
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-emerald-800 text-center mb-2">Tez seçim</p>
              <div className="grid grid-cols-2 gap-2">{quickAmountButtons}</div>
            </div>
            <div className="min-h-[5.5rem] flex items-stretch">
              {changeDisplay ? (
                <div className="w-full">{changeDisplay}</div>
              ) : (
                <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm text-center p-4">
                  Məbləğ daxil edin — para üstü burada görünəcək
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <AmountCalculator value={alinanMebleg} onChange={setAlinanMebleg} fullWidth />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200/80 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-center text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/90">
              Ödəniləcək məbləğ
            </p>
            <p className="font-mono text-4xl font-bold tabular-nums mt-1 tracking-tight">
              {Number(discountedTotal || 0).toFixed(2)}
              <span className="text-2xl font-semibold ml-1 opacity-90">₼</span>
            </p>
          </div>
          <div className="p-4 space-y-4 bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{quickAmountButtons}</div>
            <AmountCalculator value={alinanMebleg} onChange={setAlinanMebleg} fullWidth />
            {changeDisplay}
          </div>
        </div>
      )
    ) : null;

  const paymentTypeOptions = [
    { type: "pesin", short: "Nağd", long: "Nağd" },
    { type: "bank-havale", short: "Kart", long: "Bank kartı" },
    { type: "musteriye-aktar", short: "Cari", long: "Müştəri hesabı" },
    { type: "parca-ode", short: "Hissə", long: "Hissə-hissə" },
  ];

  const paymentTypeBlock = (
    <div>
      <p className={labelClass}>Ödəniş növü</p>
      <div
        className={
          fullPage
            ? "grid grid-cols-2 sm:grid-cols-4 gap-2"
            : "grid grid-cols-2 gap-2"
        }
      >
        {paymentTypeOptions.map(({ type, short, long }) => (
          <label
            key={type}
            className={`flex items-center justify-center rounded-xl border cursor-pointer transition touch-manipulation hover:border-indigo-300 ${
              fullPage
                ? "px-2 py-2.5 text-xs sm:text-sm font-semibold lg:px-3 lg:py-3 lg:text-sm"
                : "px-3 py-3 text-sm font-medium"
            } ${
              selectedPaymentType === type
                ? "border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <input
              type="radio"
              name="odemeType"
              checked={selectedPaymentType === type}
              onChange={() => handlePaymentTypeChange(type)}
              className="sr-only"
            />
            {fullPage ? (
              <>
                <span className="lg:hidden">{short}</span>
                <span className="hidden lg:inline">{long}</span>
              </>
            ) : (
              long
            )}
          </label>
        ))}
      </div>
    </div>
  );

  const summaryBlock = (
    <div className={`grid gap-2 ${fullPage ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 gap-3"}`}>
      <div>
        <label className={labelClass}>Toplam</label>
        <input className={fieldClass} type="text" value={`${Number(totalAmount || 0).toFixed(2)} ₼`} readOnly />
      </div>
      <div>
        <label className={labelClass}>Ön ödəniş</label>
        <input
          className={`${fieldClass} bg-emerald-50 border-emerald-200`}
          type="text"
          value={`${Number(resolvedPrepaid || 0).toFixed(2)} ₼`}
          readOnly
        />
      </div>
      <div>
        <label className={labelClass}>Endirim %</label>
        <input
          className={fieldClass}
          type="number"
          min="0"
          max="100"
          step="1"
          value={discount}
          onChange={(e) =>
            setDiscount(e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value))))
          }
        />
      </div>
      <div>
        <label className={labelClass}>Ödəniləcək</label>
        <input
          className={`${fieldClass} bg-indigo-50 border-indigo-200 font-semibold text-indigo-700`}
          type="text"
          value={`${Number(discountedTotal || 0).toFixed(2)} ₼`}
          readOnly
        />
      </div>
    </div>
  );

  const formContent = (
    <>
      {/* ✅ PRINT SAHƏSİ – yalnız qəbz üçün (istəyə görə zənginləşdir) */}
      <div ref={printRef} style={{ position: "absolute", left: -99999, top: -99999 }}>
        <div className="title">Qəbz</div>
        <div className="row"><span className="muted">Sifariş:</span><span>{resolvedOrderId ?? "—"}</span></div>
        <div className="row"><span className="muted">Cəmi:</span><span>{Number(totalAmount || 0).toFixed(2)} ₼</span></div>
        <div className="row"><span className="muted">Endirim:</span><span>{Number(discount || 0)} %</span></div>
        <div className="row"><span className="muted">Ön ödəniş:</span><span>{Number(resolvedPrepaid || 0).toFixed(2)} ₼</span></div>
        <div className="row"><span className="muted">Ödəniləcək:</span><span>{Number(discountedTotal || 0).toFixed(2)} ₼</span></div>
        <div className="hr"></div>
        <div className="muted">{new Date().toLocaleString()}</div>
      </div>

      <form id="hesab-kes-form" onSubmit={handleSubmit} className="space-y-4">
        {summaryBlock}
        {paymentTypeBlock}

        {isCariMusteriSelected && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className={labelClass}>Müştəri</label>
            <select
              className={fieldClass}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              value={selectedCustomerId || ""}
            >
              <option value="">Seçin</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {cashSection}

        {isParcaParcaOde && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberOfPeopleChange(num)}
                  className={`flex-1 min-w-[4.5rem] py-2 rounded-lg border text-sm font-medium transition ${
                    numberOfPeople === num
                      ? "border-indigo-500 bg-indigo-100 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {num} nəfər
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {sum.map((_, index) => (
                <div key={index} className="grid grid-cols-[2rem_1fr] gap-2 items-center">
                  <span className="text-sm font-semibold text-slate-500 text-center">{index + 1}.</span>
                  <input
                    type="number"
                    step="0.01"
                    value={sum[index]}
                    onChange={(e) => handleSumChange(index, e.target.value)}
                    className={fieldClass}
                  />
                </div>
              ))}
            </div>
            {sumMessage && (
              <p
                className={`text-sm font-medium rounded-lg px-3 py-2 ${
                  totalSum > discountedTotal ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
                }`}
              >
                {sumMessage}
              </p>
            )}
          </div>
        )}

        {!fullPage && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSubmitting ? "İcra olunur..." : "Hesab kəs"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="sm:w-auto rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              {isPrinting ? "Çap..." : "Qəbz çap"}
            </button>
          </div>
        )}
      </form>
    </>
  );

  if (!fullPage) {
    return (
      <>
        {formContent}
      {/* Nağd modal */}
      <Modal isOpen={showCashModal} onClose={() => setShowCashModal(false)}>
        <h2 className="text-lg font-bold mb-4">Nağd ödəniş</h2>

        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Ümumi Məbləğ:</div>
          <div className="px-3 py-2 border rounded bg-gray-100 text-lg font-semibold text-red-600">
            {Number(discountedTotal || 0).toFixed(2)} ₼
          </div>
        </div>

        <div className="mb-4">
          <AmountCalculator value={alinanMebleg} onChange={setAlinanMebleg} />
        </div>

        {qaliqMebleg !== null && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Qalıq:</label>
            <div className={`px-3 py-2 border rounded ${qaliqMebleg < 0 ? "text-red-600" : "text-green-600"}`}>
              {qaliqMebleg.toFixed(2)} ₼
              {qaliqMebleg < 0 ? " (Eksik məbləğ)" : " (Qaytarılacaq)"}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowCashModal(false)}>
            Ləğv et
          </button>

          {/* ✅ Sadəcə Hesab Kəs (məbləğ yoxlaması olmadan) */}
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            // əvvəl səhv idi: disabled {alinanMebleg && parseFloat(alinanMebleg) > 0}
            // indi həmişə aktiv, çünki "sadəcə hesab kəs" üçün məbləğ şərti yoxdur
            onClick={() => {
              setShowCashModal(false);
              handleSubmit(null, true); // ✅ məbləğ yoxlamasını bypass edir
            }}
          >
            Sadəcə Hesab Kəs
          </button>

          {/* ✅ Təsdiqlə (nağd alinanMebleg yoxlanır) */}
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!alinanMebleg || parseFloat(alinanMebleg || 0) < discountedTotal}
            onClick={(e) => {
              setShowCashModal(false);
              handleSubmit(e, false);
            }}
          >
            Təsdiqlə
          </button>
        </div>
      </Modal>
      </>
    );
  }

  return (
    <>
      <div ref={printRef} style={{ position: "absolute", left: -99999, top: -99999 }}>
        <div className="title">Qəbz</div>
        <div className="row">
          <span className="muted">Sifariş:</span>
          <span>{resolvedOrderId ?? "—"}</span>
        </div>
        <div className="row">
          <span className="muted">Cəmi:</span>
          <span>{Number(totalAmount || 0).toFixed(2)} ₼</span>
        </div>
        <div className="row">
          <span className="muted">Endirim:</span>
          <span>{Number(discount || 0)} %</span>
        </div>
        <div className="row">
          <span className="muted">Ön ödəniş:</span>
          <span>{Number(resolvedPrepaid || 0).toFixed(2)} ₼</span>
        </div>
        <div className="row">
          <span className="muted">Ödəniləcək:</span>
          <span>{Number(discountedTotal || 0).toFixed(2)} ₼</span>
        </div>
        <div className="hr" />
        <div className="muted">{new Date().toLocaleString()}</div>
      </div>
      <HesabKesStitchLayout
        tableName={tableName}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        totalAmount={totalAmount}
        resolvedPrepaid={resolvedPrepaid}
        discount={discount}
        setDiscount={setDiscount}
        discountedTotal={discountedTotal}
        selectedPaymentType={selectedPaymentType}
        onPaymentTypeChange={handlePaymentTypeChange}
        isCariMusteriSelected={isCariMusteriSelected}
        customerOptions={customerOptions}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        isParcaParcaOde={isParcaParcaOde}
        numberOfPeople={numberOfPeople}
        onNumberOfPeopleChange={handleNumberOfPeopleChange}
        sum={sum}
        onSumChange={handleSumChange}
        sumMessage={sumMessage}
        alinanMebleg={alinanMebleg}
        setAlinanMebleg={setAlinanMebleg}
        qaliqMebleg={qaliqMebleg}
        isSubmitting={isSubmitting}
        isPrinting={isPrinting}
        onSubmitForce={() => handleSubmit(null, true)}
        onPrint={handlePrint}
      />
    </>
  );
}

export default HesapKes;
