export const PAYMENT_METHODS = [
  { value: "cash", label: "Nağd" },
  { value: "card", label: "Kart" },
  { value: "bank_transfer", label: "Bank köçürməsi" },
  { value: "other", label: "Digər" },
];

export const EXPENSE_STATUSES = [
  { value: "paid", label: "Ödənilib" },
  { value: "pending", label: "Gözləyir" },
  { value: "cancelled", label: "Ləğv" },
];

export const paymentLabel = (v) =>
  PAYMENT_METHODS.find((p) => p.value === v)?.label || v;

export const statusLabel = (v) =>
  EXPENSE_STATUSES.find((s) => s.value === v)?.label || v;
