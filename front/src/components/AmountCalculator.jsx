import { useState } from "react";

export default function AmountCalculator({ value, onChange }) {
  const addNumber = (num) => {
    if (num === "." && value.includes(".")) return;
    onChange(value + num);
  };

  const clearInput = () => onChange("");

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        Müştəridən alınan məbləğ:
      </label>
      <input
        type="text"
        className="w-full border rounded px-3 py-2 mb-2"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (/^\d*\.?\d*$/.test(val)) {
            onChange(val);
          }
        }}
        placeholder="Məsələn: 100"
      />
      <div className="grid grid-cols-4 gap-1 max-w-xs">
        {[1,2,3,4,5,6,7,8,9,".",0].map((item) => (
          <button
            key={item}
            type="button"
            className="bg-gray-200 py-2 rounded text-center hover:bg-gray-300"
            onClick={() => addNumber(item.toString())}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="col-span-2 bg-red-400 text-white py-2 rounded hover:bg-red-500"
          onClick={clearInput}
        >
          Təmizlə
        </button>
      </div>
    </div>
  );
}
