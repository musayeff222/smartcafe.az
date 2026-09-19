import axios from "axios";
import { base_url } from "../../api/index";

export const adminHeaders = (extra = {}) => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  },
});

export const adminGet = (path, params) =>
  axios.get(`${base_url}${path}`, { ...adminHeaders(), params });
export const adminPost = (path, data, extra) =>
  axios.post(`${base_url}${path}`, data, adminHeaders(extra));
export const adminPut = (path, data) =>
  axios.put(`${base_url}${path}`, data, adminHeaders());
export const adminDelete = (path, data, extraHeaders = {}) =>
  axios.delete(`${base_url}${path}`, {
    ...adminHeaders(extraHeaders),
    data,
  });
export const adminUpload = (path, formData) =>
  axios.post(`${base_url}${path}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      Accept: "application/json",
    },
  });

/**
 * Turn a Laravel/axios error into a short Azerbaijani message.
 * If validation errors exist, joins the first error per field.
 */
export const friendlyError = (err, fallback = "Xəta baş verdi") => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (data.message && (!data.errors || Object.keys(data.errors).length === 0)) {
    return data.message;
  }
  if (data.errors) {
    const parts = Object.values(data.errors)
      .flat()
      .slice(0, 3);
    if (parts.length) return parts.join(" · ");
  }
  return data.message || fallback;
};

/**
 * Field-level errors (for form validation). Returns an object like { email: "..." }.
 */
export const fieldErrors = (err) => {
  const errors = err?.response?.data?.errors;
  if (!errors) return {};
  const out = {};
  for (const [k, v] of Object.entries(errors)) {
    out[k] = Array.isArray(v) ? v[0] : String(v);
  }
  return out;
};
