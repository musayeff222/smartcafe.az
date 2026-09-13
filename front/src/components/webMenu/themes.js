/** Web menyu dizayn şablonları */

export const WEB_MENU_TEMPLATES = [
  {
    id: "classic",
    defaultTheme: "#6366f1",
    defaultBg: "#f8fafc",
    preview: {
      bg: "#f8fafc",
      accent: "#6366f1",
      card: "#ffffff",
      text: "#1e293b",
    },
  },
  {
    id: "flame",
    defaultTheme: "#e63946",
    defaultBg: "#0d0d0d",
    preview: {
      bg: "#0d0d0d",
      accent: "#e63946",
      card: "#1a1a1a",
      text: "#ffffff",
    },
  },
  {
    id: "modern",
    defaultTheme: "#7c3aed",
    defaultBg: "#ede9fe",
    preview: {
      bg: "linear-gradient(160deg, #ede9fe, #f0f9ff)",
      accent: "#7c3aed",
      card: "rgba(255,255,255,0.75)",
      text: "#312e81",
    },
  },
];

export const getTemplateDefaults = (templateId) => {
  const t = WEB_MENU_TEMPLATES.find((x) => x.id === templateId) || WEB_MENU_TEMPLATES[0];
  return { theme: t.defaultTheme, bg: t.defaultBg };
};

export const formatPrice = (n) => `${Number(n || 0).toFixed(2)} ₼`;
