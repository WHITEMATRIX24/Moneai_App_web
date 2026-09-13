import api from "./api.js";

// ==============================
// STORAGE HELPERS
// ==============================

export function getStoredToken() {
  return (
    sessionStorage.getItem("mone_access_token") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_access_token")
      : null)
  );
}

export function getStoredRefreshToken() {
  return (
    sessionStorage.getItem("mone_refresh_token") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_refresh_token")
      : null)
  );
}

export function getStoredSessionId() {
  return (
    sessionStorage.getItem("mone_session_id") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_session_id")
      : null)
  );
}

export function getAccountType() {
  return (
    sessionStorage.getItem("mone_account_type") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_account_type")
      : null)
  );
}

export function getActiveStorage() {
  if (sessionStorage.getItem("mone_access_token")) {
    return sessionStorage;
  }
  if (
    localStorage.getItem("mone_remember_me") === "true" &&
    localStorage.getItem("mone_access_token")
  ) {
    return localStorage;
  }
  return sessionStorage;
}

export function clearAuthSession() {
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
}

// ==============================
// STORE AUTH SESSION
// ==============================

export function storeAuthSession(data, accountType, rememberMe = false) {
  clearAuthSession();

  // If rememberMe is false, use sessionStorage so closing the browser requires logging in again
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("mone_access_token", data.accessToken);
  storage.setItem("mone_refresh_token", data.refreshToken);
  storage.setItem("mone_session_id", data.sessionId);
  storage.setItem("mone_account_type", accountType);
  storage.setItem("mone_user", JSON.stringify(data.user));

  if (rememberMe) {
    localStorage.setItem("mone_remember_me", "true");
  }
}

// ==============================
// LOGIN
// ==============================

export async function login(accountType, email, password, rememberMe = false) {
  const endpoint =
    accountType === "admin" ? "/auth/admin/login" : "/auth/user/login";

  const { data } = await api.post(endpoint, {
    email,
    password,
  });

  const resolvedAccountType = data.accountType || accountType;

  storeAuthSession(data, resolvedAccountType, rememberMe);

  return data;
}

// ==============================
// REGISTER USER
// ==============================

export async function registerUser(userData) {
  const { data } = await api.post("/auth/user/register", userData);

  if (data?.accessToken && data?.refreshToken && data?.sessionId) {
    storeAuthSession(data, data.accountType || "user", false);
  }

  return data;
}

// ==============================
// REFRESH ACCESS TOKEN
// ==============================

export async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await api.post("/auth/refresh", {
    refreshToken,
  });

  const storage = getActiveStorage();
  storage.setItem("mone_access_token", data.accessToken);

  return data.accessToken;
}

// ==============================
// LOGOUT
// ==============================

export async function logout() {
  const sessionId = getStoredSessionId();

  try {
    if (sessionId) {
      await api.post("/auth/logout", {
        sessionId,
      });
    }
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    clearAuthSession();
  }
}

// ==============================
// GET STORED USER
// ==============================

export function getStoredUser() {
  const accountType = getAccountType();

  if (accountType !== "user") {
    return null;
  }

  return readStoredAccount();
}

// ==============================
// GET STORED ADMIN
// ==============================

export function getStoredAdmin() {
  const accountType = getAccountType();

  if (accountType !== "admin") {
    return null;
  }

  return readStoredAccount();
}

// ==============================
// INTERNAL STORAGE READER
// ==============================

export function getStoredAccount() {
  return readStoredAccount();
}

function readStoredAccount() {
  const storedUser =
    sessionStorage.getItem("mone_user") ||
    (localStorage.getItem("mone_remember_me") === "true"
      ? localStorage.getItem("mone_user")
      : null);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    clearAuthSession();
    return null;
  }
}
