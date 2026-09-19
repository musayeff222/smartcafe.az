import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  hideClose = false,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const el = dialogRef.current?.querySelector(
        "input, textarea, select, button, [tabindex]:not([tabindex='-1'])"
      );
      el?.focus?.();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 animate-sc-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "sc-modal-title" : undefined}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={[
          "w-full bg-white dark:bg-[#111a2e] rounded-2xl shadow-admin-lg overflow-hidden",
          "border border-slate-200 dark:border-[#1f2a44] animate-sc-in",
          widths[size] || widths.md,
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-[#1f2a44]">
            <div className="min-w-0">
              {title && (
                <h3 id="sc-modal-title" className="font-bold text-slate-800 dark:text-slate-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400"
                aria-label="Bağla"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-[#1f2a44] bg-slate-50/60 dark:bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
