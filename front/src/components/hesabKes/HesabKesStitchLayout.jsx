import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import AmountCalculator from "../AmountCalculator";

const POS_LABEL = "text-[10px] font-bold uppercase tracking-wider text-pos-outline mb-0.5 block font-pos";

const PAYMENT_METHODS = [
  { type: "pesin", label: "Nağd", icon: "payments" },
  { type: "bank-havale", label: "Kart", icon: "credit_card" },
  { type: "musteriye-aktar", label: "Cari", icon: "account_balance_wallet" },
  { type: "parca-ode", label: "Hissə", icon: "pie_chart" },
];

function formatReceived(value) {
  if (!value || value === "") return "0.00";
  const n = parseFloat(value);
  return Number.isNaN(n) ? value : n.toFixed(2);
}

function SummaryFields({ totalAmount, resolvedPrepaid, discount, setDiscount, discountedTotal }) {
  return (
    <div className="space-y-2 shrink-0">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={POS_LABEL}>Toplam</label>
          <div className="bg-white px-2 py-2 rounded-lg border border-pos-outline-variant text-sm font-pos-mono font-semibold tabular-nums">
            {Number(totalAmount || 0).toFixed(2)} ₼
          </div>
        </div>
        <div>
          <label className={POS_LABEL}>Ön ödəniş</label>
          <div className="bg-white px-2 py-2 rounded-lg border border-pos-outline-variant text-sm font-pos-mono font-semibold tabular-nums">
            {Number(resolvedPrepaid || 0).toFixed(2)} ₼
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={POS_LABEL}>Endirim %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="numeric"
            value={discount}
            onChange={(e) =>
              setDiscount(e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value))))
            }
            className="w-full bg-white px-2 py-2 rounded-lg border border-pos-outline-variant text-sm font-pos-mono font-semibold focus:border-pos-primary outline-none"
          />
        </div>
        <div>
          <label className={POS_LABEL}>Ödəniləcək</label>
          <div className="bg-pos-primary text-pos-on-primary px-2 py-2 rounded-lg font-pos-mono text-sm font-bold tabular-nums">
            {Number(discountedTotal || 0).toFixed(2)} ₼
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentTypeGrid({ selectedPaymentType, onPaymentTypeChange, compact }) {
  return (
    <div className={`grid gap-1.5 shrink-0 ${compact ? "grid-cols-4" : "grid-cols-2"}`}>
      {PAYMENT_METHODS.map(({ type, label, icon }) => {
        const active = selectedPaymentType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onPaymentTypeChange(type)}
            className={`flex flex-col items-center justify-center rounded-lg border-2 transition-all touch-manipulation ${
              compact ? "py-2 px-1 min-h-[2.75rem]" : "py-3 min-h-[3.25rem]"
            } ${
              active
                ? "border-pos-primary bg-pos-primary-container/10 text-pos-primary font-bold"
                : "border-pos-outline-variant bg-white text-pos-on-surface-variant"
            }`}
          >
            <span className={`material-symbols-outlined ${compact ? "text-xl" : "text-2xl"}`}>{icon}</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PaySubmitButton({ isSubmitting, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
    >
      payments
    </span>
  );
}

export default function HesabKesStitchLayout({
  tableName,
  onCancel,
  onSubmit,
  totalAmount,
  resolvedPrepaid,
  discount,
  setDiscount,
  discountedTotal,
  selectedPaymentType,
  onPaymentTypeChange,
  isCariMusteriSelected,
  customerOptions,
  selectedCustomerId,
  setSelectedCustomerId,
  isParcaParcaOde,
  numberOfPeople,
  onNumberOfPeopleChange,
  sum,
  onSumChange,
  sumMessage,
  alinanMebleg,
  setAlinanMebleg,
  qaliqMebleg,
  isSubmitting,
  isPrinting,
  onSubmitForce,
  onPrint,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isCash = selectedPaymentType === "pesin";
  const changeText = qaliqMebleg !== null ? Math.abs(qaliqMebleg).toFixed(2) : "0.00";
  const changeNegative = qaliqMebleg !== null && qaliqMebleg < 0;

  const changeBlock = (
    <div
      className={`rounded-xl flex flex-col items-center justify-center shrink-0 py-3 px-2 relative overflow-hidden ${
        changeNegative ? "bg-pos-error" : "bg-pos-inverse-surface"
      } text-white`}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-pos-primary-fixed-dim relative z-10">
        {changeNegative ? "Çatışmayan" : "Para üstü"}
      </p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-pos-mono font-extrabold text-pos-primary-fixed tabular-nums leading-none relative z-10">
        {changeText} ₼
      </p>
      <p className="text-[10px] text-pos-primary-fixed-dim relative z-10 mt-0.5">
        Alınan: {formatReceived(alinanMebleg)} ₼
      </p>
    </div>
  );

  const quickRow = (
    <div className="grid grid-cols-4 gap-1.5 shrink-0">
      <button
        type="button"
        className="col-span-4 bg-pos-primary text-pos-on-primary py-2 rounded-lg text-xs font-bold touch-manipulation active:scale-[0.98]"
        onClick={() => setAlinanMebleg(String(discountedTotal))}
      >
        Dəqiq {Number(discountedTotal || 0).toFixed(2)} ₼
      </button>
      {[50, 100, 200].map((amt) => (
        <button
          key={amt}
          type="button"
          className="bg-white border border-pos-outline-variant py-2 rounded-lg font-pos-mono text-sm font-bold touch-manipulation"
          onClick={() => setAlinanMebleg(String(amt))}
        >
          {amt}
        </button>
      ))}
    </div>
  );

  const cashWorkspace = (
    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(11rem,14rem)_1fr] gap-2 h-full">
      <div className="flex flex-col gap-2 min-h-0 md:max-h-full">
        {changeBlock}
        {quickRow}
      </div>
      <div className="min-h-0 h-full flex flex-col">
        <AmountCalculator value={alinanMebleg} onChange={setAlinanMebleg} variant="stitch" fillHeight />
      </div>
    </div>
  );

  const sideExtras = (
    <>
      {isCariMusteriSelected && (
        <select
          className="w-full bg-white p-2 rounded-lg border border-pos-outline-variant text-sm shrink-0"
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          value={selectedCustomerId || ""}
        >
          <option value="">Müştəri seçin</option>
          {customerOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {isParcaParcaOde && (
        <ParcaOdeBlock
          numberOfPeople={numberOfPeople}
          onNumberOfPeopleChange={onNumberOfPeopleChange}
          sum={sum}
          onSumChange={onSumChange}
          sumMessage={sumMessage}
        />
      )}
    </>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-pos-surface text-pos-on-surface font-pos overflow-hidden h-[100dvh] max-h-[100dvh]">
      {/* Minimal başlıq — yalnız geri + masa */}
      <header className="shrink-0 h-11 flex items-center gap-2 px-2 border-b border-pos-outline-variant bg-white z-20">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-pos-surface-container-high text-pos-primary touch-manipulation shrink-0"
          aria-label="Geri"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm sm:text-base font-bold truncate flex-1">{tableName}</h1>
      </header>

      <form
        id="hesab-kes-form"
        onSubmit={onSubmit}
        className="flex flex-1 min-h-0 overflow-hidden"
      >
        {/* Sol: məbləğ + ödəniş (tablet/PC) */}
        <aside className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col gap-2 p-2 border-r border-pos-outline-variant bg-pos-surface-container min-h-0 overflow-y-auto">
          <SummaryFields
            totalAmount={totalAmount}
            resolvedPrepaid={resolvedPrepaid}
            discount={discount}
            setDiscount={setDiscount}
            discountedTotal={discountedTotal}
          />
          <div>
            <label className={POS_LABEL}>Ödəniş növü</label>
            <PaymentTypeGrid selectedPaymentType={selectedPaymentType} onPaymentTypeChange={onPaymentTypeChange} />
          </div>
          {sideExtras}
        </aside>

        {/* Mərkəz — scroll yox, tam hündürlük */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="md:hidden shrink-0 p-2 space-y-2 border-b border-pos-outline-variant bg-pos-surface-container-low">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-pos-outline-variant text-xs font-bold touch-manipulation"
            >
              Məbləğ / endirim
              <span className="material-symbols-outlined text-lg">
                {detailsOpen ? "expand_less" : "expand_more"}
              </span>
            </button>
            {detailsOpen && (
              <SummaryFields
                totalAmount={totalAmount}
                resolvedPrepaid={resolvedPrepaid}
                discount={discount}
                setDiscount={setDiscount}
                discountedTotal={discountedTotal}
              />
            )}
            <PaymentTypeGrid compact selectedPaymentType={selectedPaymentType} onPaymentTypeChange={onPaymentTypeChange} />
            {sideExtras}
          </div>

          <div className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
            {isCash ? (
              cashWorkspace
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <p className="text-3xl font-pos-mono font-bold text-pos-primary tabular-nums mb-2">
                    {Number(discountedTotal || 0).toFixed(2)} ₼
                  </p>
                  <p className="text-sm text-pos-outline mb-4">Ödənişi təsdiqləyin</p>
                  <button
                    type="button"
                    className="text-pos-primary font-semibold underline"
                    onClick={() => onPaymentTypeChange("pesin")}
                  >
                    Nağd / rəqəm paneli
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobil alt panel */}
          <footer className="md:hidden shrink-0 border-t border-pos-outline-variant bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={onPrint}
                disabled={isPrinting}
                className="col-span-1 flex flex-col items-center justify-center py-2 rounded-lg border border-pos-outline-variant disabled:opacity-50 touch-manipulation"
              >
                <span className="material-symbols-outlined text-xl">receipt_long</span>
              </button>
              <button
                type="button"
                onClick={onSubmitForce}
                disabled={isSubmitting || !isCash}
                className="col-span-1 flex flex-col items-center justify-center py-2 rounded-lg border border-pos-outline-variant disabled:opacity-40 touch-manipulation"
              >
                <span className="material-symbols-outlined text-xl">bolt</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-label="Ödənişi tamamla"
                className="col-span-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-pos-tertiary-container text-white disabled:opacity-60 touch-manipulation min-h-[3rem]"
              >
                <PaySubmitButton className="text-4xl" />
                {isSubmitting && <span className="text-xs font-bold">...</span>}
              </button>
            </div>
          </footer>
        </section>

        {/* Sağ: ödəniş ikonu (mətn yox) */}
        <aside className="hidden md:flex w-16 lg:w-20 shrink-0 bg-pos-tertiary-container flex-col p-2 gap-2 min-h-0">
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Hesab kəs — ödənişi tamamla"
            title="Ödənişi tamamla"
            className="flex-1 min-h-0 flex items-center justify-center rounded-2xl bg-pos-tertiary hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all touch-manipulation shadow-lg"
          >
            <PaySubmitButton className="text-5xl lg:text-6xl text-pos-on-tertiary-container" />
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={isPrinting}
            className="shrink-0 py-2 rounded-xl bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 touch-manipulation"
            title="Qəbz"
          >
            <span className="material-symbols-outlined block text-center text-2xl">receipt_long</span>
          </button>
          <button
            type="button"
            onClick={onSubmitForce}
            disabled={isSubmitting || !isCash}
            className="shrink-0 py-2 rounded-xl bg-white/20 text-white hover:bg-white/30 disabled:opacity-40 touch-manipulation"
            title="Sadəcə kəs"
          >
            <span className="material-symbols-outlined block text-center text-2xl">done</span>
          </button>
        </aside>
      </form>
    </div>
  );
}

function ParcaOdeBlock({ numberOfPeople, onNumberOfPeopleChange, sum, onSumChange, sumMessage }) {
  return (
    <div className="space-y-1.5 shrink-0">
      <div className="grid grid-cols-4 gap-1">
        {[2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onNumberOfPeopleChange(num)}
            className={`py-1.5 rounded border text-xs font-medium touch-manipulation ${
              numberOfPeople === num ? "border-pos-primary bg-pos-primary-container/20 text-pos-primary" : "bg-white"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      {sum.map((val, index) => (
        <input
          key={index}
          type="number"
          step="0.01"
          inputMode="decimal"
          value={val}
          onChange={(e) => onSumChange(index, e.target.value)}
          className="w-full bg-white p-2 rounded-lg border border-pos-outline-variant font-pos-mono text-sm"
          placeholder={`Hissə ${index + 1}`}
        />
      ))}
      {sumMessage && <p className="text-[10px] text-pos-error font-medium">{sumMessage}</p>}
    </div>
  );
}
