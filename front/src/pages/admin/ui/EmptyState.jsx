import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Heç nə tapılmadı",
  description,
  cta,
  onCta,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center py-10 px-4",
        className,
      ].join(" ")}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 grid place-items-center text-slate-400 dark:text-slate-500 mb-3">
        <Icon size={26} />
      </div>
      <div className="font-semibold text-slate-800 dark:text-slate-100">{title}</div>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
          {description}
        </p>
      )}
      {cta && (
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={onCta}>{cta}</Button>
        </div>
      )}
    </div>
  );
}
