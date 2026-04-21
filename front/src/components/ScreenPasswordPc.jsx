import React, { useState } from "react";
import SecurityGate from "./SecurityGate";
import { isCategoryEnabled } from "../utils/securityPasswords";

// Köhnə ScreenPasswordPc (hardcoded 248765) əvəzi.
const ScreenPasswordPc = ({ category = "anbar", onSuccess }) => {
  const [unlocked, setUnlocked] = useState(
    () => !isCategoryEnabled(category)
  );

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

export default ScreenPasswordPc;
