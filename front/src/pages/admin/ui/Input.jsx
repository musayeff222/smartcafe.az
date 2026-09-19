import React from "react";

export const inputBase =
  "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition " +
  "dark:bg-[#0f1830] dark:border-[#1f2a44] dark:text-slate-100 dark:placeholder:text-slate-500 " +
  "dark:focus:bg-[#111a2e] disabled:opacity-70 disabled:cursor-not-allowed";

const Input = React.forwardRef(function Input(
  { className = "", label, hint, error, icon: Icon, ...props },
  ref
) {
  const inputCls = [
    inputBase,
    Icon ? "pl-9" : "",
    error ? "!border-rose-300 dark:!border-rose-400/60 focus:!ring-rose-400" : "",
    className,
  ].join(" ");
  return (
    <label className="block text-sm">
      {label && (
        <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </span>
      )}
      <span className="relative block">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}
        <input ref={ref} className={inputCls} {...props} />
      </span>
      {error ? (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
});

export default Input;
