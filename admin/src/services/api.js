import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1",

  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// REQUEST INTERCEPTOR
// ========================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mone_access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ========================================
// RESPONSE INTERCEPTOR
// ========================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      const isLoginRequest =
        requestUrl.includes("/auth/user/login") ||
        requestUrl.includes("/auth/admin/login");

      const isRefreshRequest = requestUrl.includes("/auth/refresh");

      // Do not force redirect for invalid login credentials
      if (!isLoginRequest && !isRefreshRequest) {
        localStorage.removeItem("mone_access_token");

        localStorage.removeItem("mone_refresh_token");

        localStorage.removeItem("mone_session_id");

        localStorage.removeItem("mone_account_type");

        localStorage.removeItem("mone_user");

        // Remove legacy keys too
        localStorage.removeItem("user_token");

        localStorage.removeItem("user_info");

        localStorage.removeItem("mone_admin_token");

        localStorage.removeItem("mone_admin_user");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
