import React, { useState } from "react";

export default function Tooltip({ content, children, position = "top", className = "" }) {
  const [open, setOpen] = useState(false);
  if (!content) return children;
  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  }[position];
  return (
    <span
      className={"relative inline-flex " + className}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 px-2 py-1 text-[11px] font-medium text-white dark:text-slate-900 shadow-md " +
            pos
          }
        >
          {content}
        </span>
      )}
    </span>
  );
}
