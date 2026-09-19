import React, { useState } from "react";
import { Copy as CopyIcon, Check } from "lucide-react";
import Tooltip from "./Tooltip";

export default function Copy({ value, title = "Kopyala", className = "", size = 12 }) {
  const [ok, setOk] = useState(false);
  if (!value) return null;
  const doCopy = async (e) => {
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(String(value));
      setOk(true);
      setTimeout(() => setOk(false), 1300);
    } catch {}
  };
  return (
    <Tooltip content={ok ? "Köçürüldü" : title} position="top">
      <button
        type="button"
        onClick={doCopy}
        className={[
          "inline-flex items-center justify-center h-6 w-6 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5",
          className,
        ].join(" ")}
        aria-label={title}
      >
        {ok ? <Check size={size} className="text-emerald-600" /> : <CopyIcon size={size} />}
      </button>
    </Tooltip>
  );
}
