import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Təsdiqləmə tələb olunur",
  description,
  confirmText = "Təsdiqlə",
  cancelText = "Ləğv et",
  variant = "danger",
  requireTyped,
  requirePassword = false,
  loading: externalLoading = false,
}) {
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setTyped("");
      setPassword("");
      setBusy(false);
    }
  }, [open]);

  const canConfirm = useMemo(() => {
    if (requireTyped && typed.trim() !== requireTyped) return false;
    if (requirePassword && !password) return false;
    return !busy && !externalLoading;
  }, [requireTyped, requirePassword, typed, password, busy, externalLoading]);

  const confirm = async () => {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm?.({ password });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title=""
      hideClose
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy || externalLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={confirm}
            disabled={!canConfirm}
            loading={busy || externalLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-500/10 grid place-items-center mb-3">
          <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {requireTyped && (
        <div className="mt-4">
          <Input
            label={`Təsdiq üçün yazın: ${requireTyped}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireTyped}
            autoComplete="off"
          />
        </div>
      )}
      {requirePassword && (
        <div className="mt-3">
          <Input
            label="Super-admin şifrəsi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canConfirm) confirm();
            }}
          />
        </div>
      )}
    </Modal>
  );
}
