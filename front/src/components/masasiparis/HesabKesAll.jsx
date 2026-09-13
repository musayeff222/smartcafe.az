import React, { useEffect } from "react";
import { X } from "lucide-react";
import HesapKes from "../HesapKes";

const HesabKesAll = ({
  setHesabKes,
  tableName,
  orderId,
  totalAmount,
  orderStocks,
  prepaidAmount,
  onPaymentSuccess,
}) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleClose = () => setHesabKes(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[min(90dvh,40rem)] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hesab-kes-title"
      >
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-indigo-100 font-semibold">
              Hesab kəs
            </p>
            <h3 id="hesab-kes-title" className="text-base sm:text-lg font-bold truncate">
              {tableName || "Masa"}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 p-2 rounded-lg bg-white/15 hover:bg-white/25 transition"
            aria-label="Bağla"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">
          <HesapKes
            orderStocks={orderStocks}
            orderId={orderId}
            totalAmount={totalAmount}
            prepaidAmount={prepaidAmount}
            setHesabKes={setHesabKes}
            onPaymentSuccess={onPaymentSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default HesabKesAll;
