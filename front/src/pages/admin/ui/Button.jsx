import React from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm",
  secondary:
    "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-[#111a2e] dark:border-[#1f2a44] dark:text-slate-200 dark:hover:bg-[#182342]",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 disabled:bg-rose-400 shadow-sm",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-emerald-400 shadow-sm",
};

const SIZES = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-3.5 py-2 text-sm rounded-xl gap-2",
  lg: "px-4 py-2.5 text-sm rounded-xl gap-2",
};

const Button = React.forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    disabled,
    className = "",
    children,
    type = "button",
    ...props
  },
  ref
) {
  const cls = [
    "inline-flex items-center justify-center font-medium select-none",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
    "transition disabled:cursor-not-allowed disabled:opacity-70",
    VARIANTS[variant] || VARIANTS.secondary,
    SIZES[size] || SIZES.md,
    className,
  ].join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cls}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 12 : 14} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 12 : 14} className="shrink-0" />
      )}
      {children && <span className="truncate">{children}</span>}
      {IconRight && !loading && (
        <IconRight size={size === "sm" ? 12 : 14} className="shrink-0" />
      )}
    </button>
  );
});

export default Button;
