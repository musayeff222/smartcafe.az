import React, { useState, useEffect } from "react";
import SecurityGate from "./SecurityGate";
import {
  isCategoryEnabled,
  prefetchSecuritySettings,
} from "../utils/securityPasswords";

const ScreenPassword2 = ({ category = "silme", onSuccess, onClose }) => {
  const [unlocked, setUnlocked] = useState(false);

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
        setUnlocked(true);
        onSuccess?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  if (unlocked) return null;

  return (
    <SecurityGate
      category={category}
      onClose={onClose}
      onSuccess={() => {
        setUnlocked(true);
        onSuccess?.();
      }}
    />
  );
};

export default ScreenPassword2;
