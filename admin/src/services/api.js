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
// TOKEN REFRESH
// ========================================
// The access token expires quickly (server default 15 min,
// ACCESS_TOKEN_EXPIRES_IN) by design, but the refresh token lasts 30
// days — that's what /auth/refresh (auth.controller.js:refreshAccessToken)
// is for. Previously nothing on the frontend ever called it, so every
// 401 from an expired access token was treated as "session invalid" and
// force-logged the user out well before the refresh token itself had
// expired. This queues concurrent requests behind a single in-flight
// refresh so five simultaneous 401s don't fire five refresh calls, and
// only logs out if the refresh itself is rejected (refresh token
// expired/revoked, session gone).

let refreshPromise = null;

function performLogout() {
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

/** Plain axios, not the `api` instance — avoids re-entering these
 * interceptors while refreshing. */
function requestNewAccessToken() {
  const refreshToken = localStorage.getItem("mone_refresh_token");

  if (!refreshToken) {
    return Promise.reject(new Error("No refresh token available"));
  }

  return axios
    .post(`${baseURL}/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      localStorage.setItem("mone_access_token", data.accessToken);
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