import React from "react";
import { FaTrash } from "react-icons/fa";
import { Plus } from "lucide-react";

const Box = "div";
const inputClass =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none";

export const StockAdditionalPrices = ({
  prices,
  onPriceChange,
  onCountChange,
  onNumberChange,
  addPrice,
  removePrice,
}) => (
  <Box className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 md:mt-0">
    {prices.length > 0 && (
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
        Çoxlu qiymət variantları
      </p>
    )}
    {prices.map((priceObj, index) => (
      <Box
        key={priceObj.id ?? `new-${index}`}
        className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-2 mb-2 last:mb-0 items-center">
        <input
          className={`${inputClass} w-full col-span-1`}
          type="number"
          value={priceObj.count}
          onChange={(e) => onNumberChange(e, index)}
          placeholder="Say"
          required
        />
        <input
          className={`${inputClass} w-full col-span-1`}
          type="text"
          value={priceObj.unit}
          onChange={(e) => onCountChange(e, index)}
          placeholder="Vahid"
          required
        />
        <input
          className={`${inputClass} w-full col-span-2 sm:col-span-1`}
          type="number"
          value={priceObj.price}
          onChange={(e) => onPriceChange(e, index)}
          step="0.01"
          placeholder="Qiymət (₼)"
          required
        />
        <button
          type="button"
          onClick={() => removePrice(index)}
          className="col-span-2 sm:col-span-1 justify-self-end sm:justify-self-auto shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition">
          <FaTrash className="mx-auto" size={14} />
        </button>
      </Box>
    ))}
    <button
      type="button"
      onClick={addPrice}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition">
      <Plus size={14} />
      Çoxlu qiymət əlavə et
    </button>
  </Box>
);
