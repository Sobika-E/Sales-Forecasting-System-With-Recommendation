import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.trim() || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginAdmin = (email, password) =>
  api.post("/auth/login", { email, password });
export const signupAdmin = (email, password) =>
  api.post("/auth/signup", { email, password });
export const verifyToken = () => api.get("/auth/verify");

// Products
export const getProducts = () => api.get("/products");
export const addProduct = (data) =>
  api.post("/products", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Predictions
export const predictYear = (year) => api.post("/predict/year", { year });
export const predictProduct = (product_name, year) =>
  api.post("/predict/product", { product_name, year });
export const predictProductMonthly = (product_name, year) =>
  api.post("/predict/product/monthly", { product_name, year });

// Combo Offers
export const getComboOffers = (year, month) =>
  api.get("/combo-offers", { params: { year, month } });
export const getLowSellers = (year, month) =>
  api.get("/combo-offers/low-sellers", { params: { year, month } });
export const generateComboOffer = (year, month, main_product) =>
  api.post("/combo-offers/generate", { year, month, main_product });

// History & Stats
export const getPredictionHistory = () => api.get("/predictions/history");
export const getDashboardStats = () => api.get("/dashboard/stats");

export default api;
