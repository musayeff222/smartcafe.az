import React, { useEffect, useState } from "react";
import axios from "axios";
import { base_url } from "../api";
import SecurityGate from "./SecurityGate";
import {
  isCategoryEnabled,
  prefetchSecuritySettings,
} from "../utils/securityPasswords";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const PasswordScreenFour = ({
  pendingRemoveData,
  onClose,
  fetchTableOrders,
  fetchQuickOrders,
  tableId,
  quickOrderId,
  category = "azaltma",
}) => {
  const [ready, setReady] = useState(false);
  const [autoDone, setAutoDone] = useState(false);

  const runSubtract = async () => {
    try {
      const url = quickOrderId
        ? `${base_url}/quick-orders/${quickOrderId}/subtract-stock`
        : `${base_url}/tables/${tableId}/subtract-stock`;

      await axios.post(
        url,
        {
          stock_id: pendingRemoveData.stockId,
          quantity: pendingRemoveData.quantity || 1,
          pivotId: pendingRemoveData.pivot_id,
          increase: pendingRemoveData.increase_boolean,
        },
        getHeaders()
      );
      if (quickOrderId) fetchQuickOrders?.();
      else fetchTableOrders?.();
      onClose?.();
    } catch (err) {
      console.error("Silinmə zamanı xəta:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await prefetchSecuritySettings();
      } catch {
        /* */
      }
      if (cancelled) return;
      if (!isCategoryEnabled(category)) {
        await runSubtract();
        setAutoDone(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || autoDone) return null;

  if (!isCategoryEnabled(category)) return null;

  return (
    <SecurityGate
      category={category}
      onClose={onClose}
      autoDismiss={false}
      onSuccess={runSubtract}
    />
  );
};

export default PasswordScreenFour;
