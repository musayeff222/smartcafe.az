import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HesapKes from "../components/HesapKes";

function storageKey(tableId) {
  return `smartcafe_hesab_kes_${tableId}`;
}

const MasaHesabKes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};

  const persisted = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(id));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [id]);

  const tableName = routeState.tableName || persisted?.tableName || `Masa #${id}`;
  const orderId = routeState.orderId ?? persisted?.orderId;
  const totalAmount = routeState.totalAmount ?? persisted?.totalAmount ?? 0;
  const prepaidAmount = routeState.prepaidAmount ?? persisted?.prepaidAmount ?? 0;

  useEffect(() => {
    if (orderId == null || orderId === "") return;
    try {
      sessionStorage.setItem(
        storageKey(id),
        JSON.stringify({
          tableName,
          orderId,
          totalAmount,
          prepaidAmount,
        })
      );
    } catch (_) {}
  }, [id, tableName, orderId, totalAmount, prepaidAmount]);

  if (orderId == null || orderId === "") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-pos-surface font-pos">
        <p className="text-pos-on-surface-variant text-center mb-4">Sifariş məlumatı tapılmadı.</p>
        <button
          type="button"
          onClick={() => navigate(`/masa-siparis/${id}`)}
          className="rounded-xl bg-pos-primary text-pos-on-primary px-6 py-3 font-semibold touch-manipulation"
        >
          Masaya qayıt
        </button>
      </div>
    );
  }

  const handleSuccess = () => {
    try {
      sessionStorage.removeItem(storageKey(id));
    } catch (_) {}
    navigate("/masalar", { replace: true });
  };

  return (
    <HesapKes
      fullPage
      tableName={tableName}
      orderId={orderId}
      totalAmount={totalAmount}
      prepaidAmount={prepaidAmount}
      onCancel={() => navigate(`/masa-siparis/${id}`)}
      onPaymentSuccess={handleSuccess}
    />
  );
};

export default MasaHesabKes;
