import axios from "axios";

export const api = axios.create({
  baseURL: "https://sistema-onmauri.onrender.com",
});

// ✅ envia token automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// ⭐ UPGRADE PROFISSIONAL
// trata sessão expirada globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error?.response?.status === 401) {
        // limpa sessão
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user_name");

        // evita loop infinito
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);