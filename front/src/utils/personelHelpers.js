import { useLanguage } from "../i18n/LanguageContext";

export const PERMISSION_KEYS = [
  "manage-tables",
  "manage-quick-orders",
  "manage-customers",
  "access-payments",
  "manage-payments",
  "manage-tanimlar",
  "manage-restaurants",
];

export const emptyPermissions = () =>
  Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false]));

export const mapPersonelFromApi = (personel) => ({
  id: personel.id,
  name: personel.name,
  email: personel.email,
  type: personel.roles?.length > 0 ? personel.roles[0].name : "unknown",
  permissions: personel.permissions || [],
});

export function usePersonelLabels() {
  const { t } = useLanguage();

  const roleLabel = (role) => {
    if (role === "general") return t("personel.roleGeneral");
    if (role === "waiter") return t("personel.roleWaiter");
    return role;
  };

  const permissionLabel = (key) => t(`personel.perm_${key.replace(/-/g, "_")}`);

  const roleBadgeClass = (role) => {
    if (role === "general") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";
    if (role === "waiter") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  };

  return { roleLabel, permissionLabel, roleBadgeClass };
}
