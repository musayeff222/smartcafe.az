import { useEffect } from "react";
import { Delete, RotateCcw } from "lucide-react";

const KEYPAD_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  [".", "0", "backspace"],
];

function formatDisplay(value) {
  if (!value || value === "") return "0.00";
  const parts = value.split(".");
  const intPart = parts[0] || "0";
  const decPart = parts[1] ?? "";
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (value.endsWith(".")) return `${formattedInt}.`;
  if (decPart.length > 0) return `${formattedInt}.${decPart}`;
  return formattedInt;
}

export default function AmountCalculator({
  value,
  onChange,
  fullWidth = false,
  variant = "default",
  fillHeight = false,
}) {
  const isStitch = variant === "stitch";

  const addNumber = (num) => {
    if (num === "." && value.includes(".")) return;
    if (num === "." && value === "") {
      onChange("0.");
      return;
    }
    onChange(value + num);
  };

  const backspace = () => onChange(value.slice(0, -1));
  const clearInput = () => onChange("");

  const handleKey = (key) => {
    if (key === "backspace") backspace();
    else addNumber(key);
  };

  const displayText = formatDisplay(value);

  useEffect(() => {
    if (!fullWidth && !isStitch) return;
    const onKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        addNumber(e.key);
      } else if (e.key === "." || e.key === ",") {
        e.preventDefault();
        addNumber(".");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      } else if (e.key === "Delete" || (e.key === "c" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        clearInput();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullWidth, isStitch, value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isStitch) {
    const keyBtn = fillHeight
      ? "bg-white border border-pos-outline-variant rounded-xl text-2xl sm:text-3xl lg:text-4xl leading-none font-pos-mono font-semibold text-pos-on-surface hover:bg-pos-primary-container/10 hover:border-pos-primary active:bg-pos-primary-container transition-colors h-full min-h-[2.5rem] flex items-center justify-center touch-manipulation select-none"
      : "bg-white border border-pos-outline-variant rounded-2xl text-2xl sm:text-[28px] leading-none font-pos-mono font-semibold text-pos-on-surface hover:bg-pos-primary-container/10 hover:border-pos-primary active:bg-pos-primary-container transition-colors min-h-[3.25rem] sm:min-h-[4rem] flex items-center justify-center touch-manipulation select-none";

    const keypadGrid = (
      <div
        className={`grid grid-cols-3 w-full h-full min-h-0 ${
          fillHeight ? "grid-rows-4 gap-1.5 flex-1" : "gap-2 sm:gap-3"
        }`}
      >
        {KEYPAD_ROWS.map((row, rowIdx) =>
          row.map((key) => {
            if (key === "backspace") {
              return (
                <button
                  key={`${rowIdx}-bs`}
                  type="button"
                  aria-label="Son rəqəmi sil"
                  className={`${keyBtn} text-pos-error hover:bg-pos-error-container`}
                  onClick={backspace}
                >
                  <span className={`material-symbols-outlined ${fillHeight ? "text-3xl lg:text-4xl" : "text-3xl sm:text-[40px]"}`}>
                    backspace
                  </span>
                </button>
              );
            }
            return (
              <button key={`${rowIdx}-${key}`} type="button" className={keyBtn} onClick={() => handleKey(key)}>
                {key}
              </button>
            );
          })
        )}
      </div>
    );

    return (
      <div
        className={`flex flex-col min-h-0 font-pos w-full h-full ${
          fillHeight ? "max-w-none" : "max-w-lg mx-auto"
        }`}
      >
        {keypadGrid}
        <div className={`grid grid-cols-2 gap-1.5 shrink-0 ${fillHeight ? "mt-1.5" : "mt-3"}`}>
          <button
            type="button"
            onClick={backspace}
            className={`flex items-center justify-center gap-1 bg-white border-2 border-pos-outline-variant rounded-lg font-bold text-pos-on-surface-variant touch-manipulation ${
              fillHeight ? "py-2 text-xs" : "py-4 rounded-xl"
            }`}
          >
            <span className="material-symbols-outlined text-lg">backspace</span>
            {!fillHeight && "Geri sil"}
          </button>
          <button
            type="button"
            onClick={clearInput}
            className={`flex items-center justify-center gap-1 bg-pos-error-container border-2 border-pos-error text-pos-on-error-container rounded-lg font-bold touch-manipulation ${
              fillHeight ? "py-2 text-xs" : "py-4 rounded-xl"
            }`}
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {!fillHeight && "Təmizlə"}
          </button>
        </div>
        <input
          type="text"
          inputMode="decimal"
          className="sr-only"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val)) onChange(val);
          }}
          aria-label="Alınan məbləğ"
        />
      </div>
    );
  }

  const digitBtn =
    "flex items-center justify-center h-14 sm:h-16 rounded-xl border-2 border-slate-300 bg-white text-3xl font-bold text-slate-900 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:bg-indigo-100 touch-manipulation select-none";

  const keypad = (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg mx-auto">
      {KEYPAD_ROWS.map((row, rowIdx) =>
        row.map((key) => {
          if (key === "backspace") {
            return (
              <button
                key={`${rowIdx}-bs`}
                type="button"
                aria-label="Son rəqəmi sil"
                className={`${digitBtn} bg-slate-100 text-slate-700`}
                onClick={backspace}
              >
                <Delete size={28} strokeWidth={2.5} />
              </button>
            );
          }
          return (
            <button key={`${rowIdx}-${key}`} type="button" className={digitBtn} onClick={() => handleKey(key)}>
              {key}
            </button>
          );
        })
      )}
    </div>
  );

  if (fullWidth) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="rounded-2xl bg-slate-900 px-4 py-5 text-center shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Müştəridən alınan məbləğ</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-mono text-4xl sm:text-5xl font-bold text-white tabular-nums leading-none" aria-live="polite">
              {displayText}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">₼</span>
          </div>
        </div>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="w-full rounded-xl border-2 border-indigo-300 bg-white px-4 py-4 text-2xl sm:text-3xl font-bold text-slate-900 text-right tabular-nums focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val)) onChange(val);
          }}
          placeholder="0.00"
        />
        {keypad}
        <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto w-full">
          <button
            type="button"
            onClick={backspace}
            className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-300 bg-slate-50 text-base font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Delete size={20} />
            Geri sil
          </button>
          <button
            type="button"
            onClick={clearInput}
            className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-red-300 bg-red-50 text-base font-semibold text-red-800 hover:bg-red-100"
          >
            <RotateCcw size={20} />
            Təmizlə
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Müştəridən alınan məbləğ
      </label>
      <div className="rounded-xl bg-slate-900 px-4 py-3 mb-3 flex items-baseline justify-end gap-2">
        <span className="font-mono text-3xl font-bold text-white tabular-nums">{displayText}</span>
        <span className="text-lg font-bold text-emerald-400">₼</span>
      </div>
      <input
        type="text"
        inputMode="decimal"
        className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-xl font-bold text-slate-900 text-right mb-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (/^\d*\.?\d*$/.test(val)) onChange(val);
        }}
        placeholder="0.00"
      />
      {keypad}
      <button
        type="button"
        onClick={clearInput}
        className="mt-2 w-full py-2.5 text-sm font-semibold text-red-700 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100"
      >
        Təmizlə
      </button>
    </div>
  );
}
