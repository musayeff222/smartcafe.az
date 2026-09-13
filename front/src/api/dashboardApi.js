import axios from "axios";
import { base_url, getAuthHeaders } from "./index";

export const dashboardApi = {
  fetch: (params = {}) =>
    axios.get(`${base_url}/restaurant-dashboard`, {
      ...getAuthHeaders(),
      params,
    }),
};
