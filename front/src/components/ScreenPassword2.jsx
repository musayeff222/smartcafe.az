import React, { useState } from "react";
import SecurityGate from "./SecurityGate";
import { isCategoryEnabled } from "../utils/securityPasswords";

// Köhnə ScreenPassword2 (hardcoded 1879) əvəzi. Default kateqoriya: "silme"
const ScreenPassword2 = ({ category = "silme", onSuccess, onClose }) => {
  const [unlocked, setUnlocked] = useState(
    () => !isCategoryEnabled(category)
  );

  if (unlocked) {
    return null;
  }

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
