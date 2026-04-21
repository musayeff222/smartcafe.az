import React, { useEffect, useState } from "react";
import axios from "axios";
import { base_url } from "../api";
import SecurityGate from "./SecurityGate";
import { isCategoryEnabled } from "../utils/securityPasswords";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Masadan məhsulun azaldılması / silinməsi üçün şifrə ekranı.
 * Şifrə təsdiqləndikdən sonra avtomatik API çağırışı edir.
 */
const PasswordScreenFour = ({
  pendingRemoveData,
  onClose,
  fetchTableOrders,
  tableId,
  category = "azaltma",
}) => {
  const [executing, setExecuting] = useState(false);

  const runSubtract = async () => {
    try {
      setExecuting(true);
      await axios.post(
        `${base_url}/tables/${tableId}/subtract-stock`,
        {
          stock_id: pendingRemoveData.stockId,
          quantity: pendingRemoveData.quantity || 1,
          pivotId: pendingRemoveData.pivot_id,
          increase: pendingRemoveData.increase_boolean,
        },
        getHeaders()
      );
      fetchTableOrders?.();
      onClose?.();
    } catch (err) {
      console.error("Silinmə zamanı xəta:", err);
    } finally {
      setExecuting(false);
    }
  };

  // Kateqoriya söndürülübsə birbaşa icra et
  useEffect(() => {
    if (!isCategoryEnabled(category)) {
      runSubtract();
    }
    // eslint-disable-next-line
  }, [category]);

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
