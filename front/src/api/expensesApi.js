import axios from "axios";
import { base_url } from "./index";

const getHeaders = (json = true) => {
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (json) headers["Content-Type"] = "application/json";
  return { headers };
};

export const expensesApi = {
  listCategories: () => axios.get(`${base_url}/expense-categories`, getHeaders()),
  createCategory: (name) =>
    axios.post(`${base_url}/expense-categories`, { name }, getHeaders()),
  updateCategory: (id, name) =>
    axios.put(`${base_url}/expense-categories/${id}`, { name }, getHeaders()),
  deleteCategory: (id) =>
    axios.delete(`${base_url}/expense-categories/${id}`, getHeaders()),

  list: (params) => axios.get(`${base_url}/expenses`, { ...getHeaders(), params }),
  get: (id) => axios.get(`${base_url}/expenses/${id}`, getHeaders()),
  create: (formData) =>
    axios.post(`${base_url}/expenses`, formData, getHeaders(false)),
  update: (id, formData) =>
    axios.put(`${base_url}/expenses/${id}`, formData, getHeaders(false)),
  remove: (id) => axios.delete(`${base_url}/expenses/${id}`, getHeaders()),

  stats: () => axios.get(`${base_url}/expenses/stats`, getHeaders()),
  grouped: (params) =>
    axios.get(`${base_url}/expenses/grouped`, { ...getHeaders(), params }),
  exportRows: (params) =>
    axios.get(`${base_url}/expenses/export`, { ...getHeaders(), params }),
  updateSettings: (data) =>
    axios.put(`${base_url}/expenses/settings`, data, getHeaders()),
};
