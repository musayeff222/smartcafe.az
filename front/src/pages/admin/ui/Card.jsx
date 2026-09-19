import React from "react";

export function Card({ className = "", padding = "md", as: Tag = "div", ...props }) {
  const pads = { none: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-6" };
  return (
    <Tag
      className={[
        "bg-white border border-slate-200 rounded-2xl shadow-admin-sm",
        "dark:bg-[#111a2e] dark:border-[#1f2a44]",
        pads[padding] || pads.md,
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ title, description, right, className = "" }) {
  return (
    <div className={["flex items-start justify-between gap-3 mb-3", className].join(" ")}> 
      <div className="min-w-0">
        {title && (
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export default Card;
