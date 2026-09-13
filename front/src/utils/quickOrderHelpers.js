/** Sifariş cəmi: məhsul cəmi − promo endirimi */
export const getQuickOrderTotal = (quickOrder) =>
  Math.max(
    0,
    Number(quickOrder?.order?.total_price ?? 0) - Number(quickOrder?.promo_discount ?? 0)
  );

/** Detallı API cavabı (quick-orders/{id}) */
export const getQuickOrderDetailTotal = (detail) =>
  Math.max(
    0,
    Number(detail?.order?.total_price ?? 0) - Number(detail?.promo_discount ?? 0)
  );
