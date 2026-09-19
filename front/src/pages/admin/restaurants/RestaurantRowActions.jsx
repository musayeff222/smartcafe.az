import React, { useEffect, useRef, useState } from "react";
import { MoreHorizontal, ExternalLink, LogIn, Bell, KeyRound, Pencil, Trash2, Copy as CopyIcon, Shield } from "lucide-react";

export default function RestaurantRowActions({
  restaurant,
  onOpen,
  onEnter,
  onNotify,
  onEdit,
  onResetPassword,
  onDelete,
  onCopyId,
  onAccessToken,
}) {
  const [open, setOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setCtxPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleContext = (e) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
  };

  const items = [
    { label: "Detala bax", icon: ExternalLink, onClick: () => onOpen?.(restaurant) },
    { label: "Restorana gir", icon: LogIn, onClick: () => onEnter?.(restaurant) },
    { label: "Bildiriş göndər", icon: Bell, onClick: () => onNotify?.(restaurant) },
    { label: "Redaktə et", icon: Pencil, onClick: () => onEdit?.(restaurant) },
    { label: "Şifrə sıfırla", icon: KeyRound, onClick: () => onResetPassword?.(restaurant) },
    { label: "Access token al", icon: Shield, onClick: () => onAccessToken?.(restaurant) },
    { label: "ID kopyala", icon: CopyIcon, onClick: () => onCopyId?.(restaurant) },
    { label: "Sil", icon: Trash2, tone: "danger", onClick: () => onDelete?.(restaurant) },
  ];

  const renderMenu = (positionStyle) => (
    <div
      ref={menuRef}
      style={positionStyle}
      className="w-52 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] rounded-xl shadow-admin-lg overflow-hidden py-1"
    >
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              setOpen(false);
              setCtxPos(null);
              it.onClick?.();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left ${
              it.tone === "danger"
                ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={14} />
            {it.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div ref={ref} className="relative inline-block" onContextMenu={handleContext}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Əməliyyatlar"
        >
          <MoreHorizontal size={16} />
        </button>
        {open && renderMenu({ position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 40 })}
      </div>
      {ctxPos && (
        <div
          className="fixed inset-0 z-40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCtxPos(null);
          }}
        >
          {renderMenu({ position: "absolute", left: ctxPos.x, top: ctxPos.y })}
        </div>
      )}
    </>
  );
}
