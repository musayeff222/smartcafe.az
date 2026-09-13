import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PAYMENT_METHODS, EXPENSE_STATUSES } from "./constants";

const Box = "div";
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1";

const emptyForm = {
  name: "",
  expense_category_id: "",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  note: "",
  payment_method: "cash",
  status: "paid",
};

export default function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  categories,
  initial,
  saving,
  canEdit = true,
}) {
  const [form, setForm] = useState(emptyForm);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name || "",
        expense_category_id: String(initial.expense_category_id || ""),
        amount: initial.amount ?? "",
        expense_date: initial.expense_date?.slice?.(0, 10) || initial.expense_date || emptyForm.expense_date,
        note: initial.note || initial.reason || "",
        payment_method: initial.payment_method || "cash",
        status: initial.status || "paid",
      });
    } else {
      setForm(emptyForm);
    }
    setReceipt(null);
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (receipt) fd.append("receipt", receipt);
    onSubmit(fd);
  };

  return (
    <Box className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <Box
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <Box className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white flex justify-between items-center">
          <h3 className="font-bold">{initial ? "Xərci düzəlt" : "Yeni xərc"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-white/20">
            <X size={18} />
          </button>
        </Box>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <Box className="flex-1 overflow-y-auto p-4 space-y-3">
            <Box>
              <label className={labelClass}>Xərc adı *</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} required disabled={!canEdit} />
            </Box>
            <Box>
              <label className={labelClass}>Kateqoriya *</label>
              <select name="expense_category_id" value={form.expense_category_id} onChange={handleChange} className={inputClass} required disabled={!canEdit}>
                <option value="">Seçin</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Box>
            <Box className="grid grid-cols-2 gap-3">
              <Box>
                <label className={labelClass}>Məbləğ (₼) *</label>
                <input type="number" step="0.01" min="0.01" name="amount" value={form.amount} onChange={handleChange} className={inputClass} required disabled={!canEdit} />
              </Box>
              <Box>
                <label className={labelClass}>Tarix *</label>
                <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange} className={inputClass} required disabled={!canEdit} />
              </Box>
            </Box>
            <Box className="grid grid-cols-2 gap-3">
              <Box>
                <label className={labelClass}>Ödəniş üsulu</label>
                <select name="payment_method" value={form.payment_method} onChange={handleChange} className={inputClass} disabled={!canEdit}>
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Box>
              <Box>
                <label className={labelClass}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={inputClass} disabled={!canEdit}>
                  {EXPENSE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Box>
            </Box>
            <Box>
              <label className={labelClass}>Qeyd</label>
              <textarea name="note" value={form.note} onChange={handleChange} rows={2} className={inputClass} disabled={!canEdit} />
            </Box>
            {canEdit && (
              <Box>
                <label className={labelClass}>Çek / foto</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="text-sm w-full" />
              </Box>
            )}
          </Box>
          {canEdit && (
            <Box className="shrink-0 flex gap-2 p-4 border-t">
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Ləğv</button>
              <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saxlanır..." : "Saxla"}
              </button>
            </Box>
          )}
        </form>
      </Box>
    </Box>
  );
}
