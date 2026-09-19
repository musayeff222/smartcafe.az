const BYPASS_KEY = "super_admin_pin_bypass";
const RETURN_KEY = "admin_return_path";
const NAME_KEY = "admin_impersonated_name";

export function isAdminImpersonating() {
  try {
    return (
      localStorage.getItem(BYPASS_KEY) === "1" &&
      !!localStorage.getItem("admin_token")
    );
  } catch {
    return false;
  }
}

export function startAdminImpersonation({ restaurantId, restaurantName, returnPath } = {}) {
  localStorage.setItem(BYPASS_KEY, "1");
  localStorage.setItem(
    RETURN_KEY,
    returnPath ||
      (restaurantId ? `/adminPage/restaurants/${restaurantId}` : "/adminPage/dashboard")
  );
  if (restaurantName) {
    localStorage.setItem(NAME_KEY, String(restaurantName));
  } else {
    localStorage.removeItem(NAME_KEY);
  }
}

export function getImpersonatedRestaurantName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function returnToAdminPanel() {
  let path = "/adminPage/dashboard";
  try {
    path = localStorage.getItem(RETURN_KEY) || path;
    localStorage.removeItem(BYPASS_KEY);
    localStorage.removeItem(RETURN_KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {
    /* */
  }
  window.location.assign(path);
}

export function clearAdminImpersonation() {
  try {
    localStorage.removeItem(BYPASS_KEY);
    localStorage.removeItem(RETURN_KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {
    /* */
  }
}
