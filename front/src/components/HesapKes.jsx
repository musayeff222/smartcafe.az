import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AccessDenied from "./AccessDenied";
import { base_url } from "../api/index";
import { useDispatch, useSelector } from "react-redux";
import { fetchTableOrderStocks } from "../redux/stocksSlice";
import Modal from "../components/HesabKesModal";
import AmountCalculator from "./AmountCalculator";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function HesapKes({ orderStocks, orderId, totalAmount, prepaidAmount = 0, setHesabKes }) {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [isCariMusteriSelected, setIsCariMusteriSelected] = useState(false);
  const [isParcaParcaOde, setIsParcaParcaOde] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [discount, setDiscount] = useState("");
  const [sum, setSum] = useState(Array(numberOfPeople).fill(0));
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [alinanMebleg, setAlinanMebleg] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { allItems, orders } = useSelector((state) => state.stocks);

  // ✅ Qəbz üçün print ref
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // ✅ Endirim + Ön ödəniş düşülmüş yekun
  const discountedTotalRaw = totalAmount * (1 - parseFloat(discount || 0) / 100);
  const discountedTotal = Math.max(
    0,
    Number((discountedTotalRaw - Number(prepaidAmount || 0)).toFixed(2))
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
    if (type === "pesin") {
      setShowCashModal(true); // nağd seçiləndə modal aç
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
      const finalAmount = Number(totalAmount || 0) - Number(prepaidAmount || 0);
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
      prepaid_amount: parseFloat(Number(prepaidAmount || 0).toFixed(2)), // ✅ ön ödəniş
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

    if (isSubmitting) return; // ikiqat submit qorumasi
    setIsSubmitting(true);
    try {
      await axios.post(
        `${base_url}/order/${orders?.[0]?.order_id || orderId}/payments`,
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

      // Modal bağlansın ki, ağ ekran yaranmasın
      if (typeof setHesabKes === "function") setHesabKes(false);

      // Tək, etibarlı redirect — navigate + reload kombinasiyası əvəzinə
      setTimeout(() => {
        window.location.href = "/masalar";
      }, 600);
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

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      {/* ✅ PRINT SAHƏSİ – yalnız qəbz üçün (istəyə görə zənginləşdir) */}
      <div ref={printRef} style={{ position: "absolute", left: -99999, top: -99999 }}>
        <div className="title">Qəbz</div>
        <div className="row"><span className="muted">Sifariş:</span><span>{orders?.[0]?.order_id || orderId}</span></div>
        <div className="row"><span className="muted">Cəmi:</span><span>{Number(totalAmount || 0).toFixed(2)} ₼</span></div>
        <div className="row"><span className="muted">Endirim:</span><span>{Number(discount || 0)} %</span></div>
        <div className="row"><span className="muted">Ön ödəniş:</span><span>{Number(prepaidAmount || 0).toFixed(2)} ₼</span></div>
        <div className="row"><span className="muted">Ödəniləcək:</span><span>{Number(discountedTotal || 0).toFixed(2)} ₼</span></div>
        <div className="hr"></div>
        <div className="muted">{new Date().toLocaleString()}</div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Toplam məbləğ */}
        <div className="border rounded bg-gray-50 m-4 p-3">
          <div className="flex items-center">
            <div className="w-1/3 flex h-14 border rounded-l items-center px-2 bg-gray-100 gap-5">
              Toplam Məbləğ
            </div>
            <input
              className="w-2/3 h-14 px-6 border border-l-0 rounded-r"
              type="text"
              value={Number(totalAmount || 0).toFixed(2)}
              readOnly
            />
          </div>
        </div>

        {/* Artıq ödənilib */}
        <div className="border rounded bg-green-50 m-4 p-3">
          <div className="flex items-center">
            <div className="w-1/3 flex h-14 border rounded-l items-center px-2 bg-gray-100 gap-5">
              Artıq ödənilib (Ön ödəniş)
            </div>
            <input
              className="w-2/3 h-14 px-6 border border-l-0 rounded-r"
              type="text"
              value={Number(prepaidAmount || orderId?.total_prepayment || 0).toFixed(2)}
              readOnly
            />
          </div>
        </div>

        {/* İndirim və Qalıq (vizual sahə) */}
        <div className="border rounded bg-gray-50 m-4 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] flex h-14 border rounded items-center px-2 bg-gray-100">
              İndirim (%)
            </div>
            <input
              className="flex-1 min-w-[220px] h-14 px-6 border rounded"
              type="number"
              min="0"
              max="100"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value))))}
            />

            <div className="flex-1 min-w-[220px] flex h-14 border rounded items-center px-2 bg-gray-100">
              Ödəniləcək (Endirim + Ön ödəniş düş.)
            </div>
            <input
              className="flex-1 min-w-[220px] h-14 px-6 border rounded"
              type="text"
              value={Number(discountedTotal || 0).toFixed(2)}
              readOnly
            />
          </div>
        </div>

        {/* Ödəniş tipi */}
        <div className="mx-4 flex flex-col gap-2">
          {["pesin", "bank-havale", "musteriye-aktar", "parca-ode"].map((type) => (
            <label
              key={type}
              className={`flex items-center p-2 border rounded bg-white shadow-sm ${
                selectedPaymentType === type ? "bg-yellow-100 border-yellow-500" : ""
              }`}
            >
              <input
                type="radio"
                name="odemeType"
                id={type}
                checked={selectedPaymentType === type}
                onChange={() => handlePaymentTypeChange(type)}
                className="mr-2"
              />
              {type === "pesin" && "Nağd"}
              {type === "bank-havale" && "Bank Kartına"}
              {type === "musteriye-aktar" && "Müştəri hesabına"}
              {type === "parca-ode" && "Hissə-hissə ödə"}
            </label>
          ))}
        </div>

        {/* Cari müştəri seçimi */}
        {isCariMusteriSelected && (
          <div id="aktar" className="p-4 bg-white shadow-md rounded-lg mt-4">
            <p className="text-lg font-semibold mb-2">Müştərilər</p>
            <select
              className="form-select block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              value={selectedCustomerId || ""}
            >
              <option value="">Seçiniz</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Hissə-hissə ödəniş */}
        {isParcaParcaOde && (
          <div id="parcaode" className="p-4 bg-white shadow-md rounded-lg mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {[2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  onClick={() => handleNumberOfPeopleChange(num)}
                  className={`flex-1 min-w-[100px] p-4 border border-gray-300 rounded-lg bg-gray-50 text-center cursor-pointer ${
                    numberOfPeople === num ? "bg-yellow-100" : ""
                  }`}
                >
                  {num} kişi
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4 text-center font-semibold border-b border-gray-300 pb-2 mb-2">
                <div>No</div>
                <div>Məbləğ</div>
                <div>Ödəniş</div>
              </div>
              <div>
                {sum.map((_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-center border-b border-gray-200 py-2">
                    <div className="flex items-center justify-center border border-gray-300 p-2 rounded">
                      {index + 1}.
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={sum[index]}
                      onChange={(e) => handleSumChange(index, e.target.value)}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                    <select className="border border-gray-300 rounded p-2 w-full">
                      <option>Peşin</option>
                      <option>Banka havalesi</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {sumMessage && (
              <div className={`p-2 mt-4 text-white font-semibold ${totalSum > discountedTotal ? "bg-red-600" : "bg-yellow-600"}`}>
                {sumMessage}
              </div>
            )}
          </div>
        )}

        {/* Hesab kəs (submit) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="block w-[calc(100%-32px)] bg-sky-600 font-medium mx-4 mb-3 py-2 px-4 rounded text-white hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "İcra olunur..." : "Hesab kəs"}
        </button>

        {/* Qəbz Çap Et */}
        <button
          type="button"
          onClick={handlePrint}
          disabled={isPrinting}
          className="block w-[calc(100%-32px)] bg-green-600 font-medium mx-4 mb-6 py-2 px-4 rounded text-white hover:bg-green-700 transition disabled:opacity-50"
        >
          {isPrinting ? "Çap olunur..." : "Qəbz Çap Et"}
        </button>
      </form>

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

export default HesapKes;
