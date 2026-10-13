import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cs_token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const mediaUrl = (path) => {
  if (!path) return "";
  const brandingPath = path.match(/\/media\/branding\/([^/?#]+)/);
  if (brandingPath) return `${import.meta.env.BASE_URL}branding/${brandingPath[1]}`;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

export default api;
