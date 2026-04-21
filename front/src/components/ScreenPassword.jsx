import React, { useState, useEffect } from "react";
import SecurityGate from "./SecurityGate";
import {
  isCategoryEnabled,
  prefetchSecuritySettings,
} from "../utils/securityPasswords";

const PasswordScreen = ({ category = "anbar", onSuccess }) => {
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
      onSuccess={() => {
        setUnlocked(true);
        onSuccess?.();
      }}
    />
  );
};

export default PasswordScreen;
