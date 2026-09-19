// Shared restaurant "health" logic used by list + detail views.
// Returns a stable descriptor { tone, label, order, days }.

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  return Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
}

export function healthOf(r) {
  const days = daysUntil(r.active_until);
  const active = !!r.is_active && (days === null || days >= 0);

  if (!r.is_active) return { tone: "neutral", label: "Passiv", order: 4, days };
  if (days !== null && days < 0) return { tone: "danger", label: "Vaxtı keçib", order: 0, days };
  if (days !== null && days <= 14) return { tone: "warning", label: `${days} gün qalıb`, order: 1, days };
  if (!active) return { tone: "neutral", label: "Passiv", order: 4, days };
  return { tone: "success", label: "Aktiv", order: 3, days };
}

export function formatMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("az-AZ", { maximumFractionDigits: 2 });
}
