import api from "./api.js";

// ==============================
// STORE AUTH SESSION
// ==============================

function storeAuthSession(data, accountType) {
  localStorage.setItem("mone_access_token", data.accessToken);

  localStorage.setItem("mone_refresh_token", data.refreshToken);

  localStorage.setItem("mone_session_id", data.sessionId);

  localStorage.setItem("mone_account_type", accountType);

  localStorage.setItem("mone_user", JSON.stringify(data.user));
}

// ==============================
// LOGIN
// ==============================

export async function login(accountType, email, password) {
  const endpoint =
    accountType === "admin" ? "/auth/admin/login" : "/auth/user/login";

  const { data } = await api.post(endpoint, {
    email,
    password,
  });

  const resolvedAccountType = data.accountType || accountType;

  storeAuthSession(data, resolvedAccountType);

  return data;
}

// ==============================
// REGISTER USER
// ==============================

export async function registerUser(userData) {
  const { data } = await api.post("/auth/user/register", userData);

  /*
   * Your backend registration currently
   * returns accessToken, refreshToken,
   * sessionId and user.
   */
  if (data?.accessToken && data?.refreshToken && data?.sessionId) {
    storeAuthSession(data, data.accountType || "user");
  }

  return data;
}

// ==============================
// REFRESH ACCESS TOKEN
// ==============================

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("mone_refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await api.post("/auth/refresh", {
    refreshToken,
  });

  localStorage.setItem("mone_access_token", data.accessToken);

  return data.accessToken;
}

// ==============================
// LOGOUT
// ==============================

export async function logout() {
  const sessionId = localStorage.getItem("mone_session_id");

  try {
    if (sessionId) {
      await api.post("/auth/logout", {
        sessionId,
      });
    }
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    localStorage.removeItem("mone_access_token");

    localStorage.removeItem("mone_refresh_token");

    localStorage.removeItem("mone_session_id");

    localStorage.removeItem("mone_account_type");

    localStorage.removeItem("mone_user");

    // legacy keys
    localStorage.removeItem("mone_admin_token");

    localStorage.removeItem("mone_admin_user");
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
// GET ACCOUNT TYPE
// ==============================

export function getAccountType() {
  return localStorage.getItem("mone_account_type");
}

// ==============================
// INTERNAL STORAGE READER
// ==============================

function readStoredAccount() {
  const storedUser = localStorage.getItem("mone_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("mone_user");

    return null;
  }
}
