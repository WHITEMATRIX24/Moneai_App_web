import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";

const api = axios.create({
  baseURL,

  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// REQUEST INTERCEPTOR
// ========================================

function getAuthToken() {
  return (
    sessionStorage.getItem("mone_access_token") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_access_token")
      : null)
  );
}

function getRefreshToken() {
  return (
    sessionStorage.getItem("mone_refresh_token") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_refresh_token")
      : null)
  );
}

function setAuthToken(token) {
  if (sessionStorage.getItem("mone_access_token")) {
    sessionStorage.setItem("mone_access_token", token);
  }
  if (
    localStorage.getItem("mone_remember_me") === "true" &&
    localStorage.getItem("mone_access_token")
  ) {
    localStorage.setItem("mone_access_token", token);
  }
}

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

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
// TOKEN REFRESH
// ========================================

let refreshPromise = null;

function performLogout() {
  const keys = [
    "mone_access_token",
    "mone_refresh_token",
    "mone_session_id",
    "mone_account_type",
    "mone_user",
    "mone_remember_me",
    "user_token",
    "user_info",
    "mone_admin_token",
    "mone_admin_user",
  ];
  keys.forEach((k) => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

/** Plain axios, not the `api` instance — avoids re-entering these
 * interceptors while refreshing. */
function requestNewAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return Promise.reject(new Error("No refresh token available"));
  }

  return axios
    .post(`${baseURL}/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      setAuthToken(data.accessToken);
      return data.accessToken;
    });
}

// ========================================
// RESPONSE INTERCEPTOR
// ========================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    const isLoginRequest =
      requestUrl.includes("/auth/user/login") ||
      requestUrl.includes("/auth/admin/login");

    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    if (error.response?.status !== 401 || isLoginRequest || isRefreshRequest) {
      return Promise.reject(error);
    }

    // Already retried once after a refresh and still 401'd — the new
    // token is genuinely no good (or the refresh token is dead too).
    // Don't loop; log out.
    if (originalRequest._retriedAfterRefresh) {
      performLogout();
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = requestNewAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest._retriedAfterRefresh = true;
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      return api.request(originalRequest);
    } catch (refreshError) {
      performLogout();
      return Promise.reject(refreshError);
    }
  },
);

export default api;