import React, { useState } from "react";
import SecurityGate from "./SecurityGate";
import { isCategoryEnabled } from "../utils/securityPasswords";

// Köhnə hardcoded "090922" dizaynının yerinə gələn yeni modern ekran.
// Bütün mövcud istifadə yerləri ilə uyğundur.
// category prop-u ilə hansı bölmə olduğu göstərilir (default "anbar").
const PasswordScreen = ({ category = "anbar", onSuccess }) => {
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

export default PasswordScreen;
