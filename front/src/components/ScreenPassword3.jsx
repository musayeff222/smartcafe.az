import React, { useState } from "react";
import SecurityGate from "./SecurityGate";
import { isCategoryEnabled } from "../utils/securityPasswords";

// Köhnə ScreenPassword3 (hardcoded 3478) — masa ləğv şifrəsi.
const PasswordScreen = ({ category = "legv", onSuccess, onClose }) => {
  const [unlocked, setUnlocked] = useState(
    () => !isCategoryEnabled(category)
  );

  if (unlocked) {
    // Söndürülmüş rejim üçün onSuccess çağırışı SecurityGate tərəfdən
    // edilir; burada başqa bir şey lazım deyil.
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

export default PasswordScreen;
