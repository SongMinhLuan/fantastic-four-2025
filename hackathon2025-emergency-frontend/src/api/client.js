const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

export const getTokenForRole = (role) => {
  if (role) {
    const roleToken = localStorage.getItem(`iflow_token_${role}`);
    if (roleToken) {
      return roleToken;
    }
  }

  return localStorage.getItem("iflow_token");
};

export const notifyAuthChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("iflow-auth"));
  }
};

export const storeAuthToken = (token, role) => {
  if (!token) {
    return;
  }
  localStorage.setItem("iflow_token", token);
  if (role) {
    localStorage.setItem(`iflow_token_${role}`, token);
  }
  notifyAuthChange();
};

export const storeAuthUser = (user, options = {}) => {
  if (!user) {
    return;
  }
  const { notify = true } = options;
  const nextRaw = JSON.stringify(user);
  const currentRaw = localStorage.getItem("iflow_user");
  if (currentRaw === nextRaw) {
    return;
  }
  localStorage.setItem("iflow_user", nextRaw);
  if (notify) {
    notifyAuthChange();
  }
};

export const getStoredUser = () => {
  const raw = localStorage.getItem("iflow_user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

export const clearAuthSession = () => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith("iflow_token")) {
      localStorage.removeItem(key);
    }
  });
  localStorage.removeItem("iflow_user");
  notifyAuthChange();
};

const rawRequest = async (path, options = {}) => {
  const { method = "GET", body, headers: customHeaders } = options;
  const headers = {
    ...customHeaders,
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  const payload = await response
    .json()
    .catch(() => ({ error: { code: "UNKNOWN", message: "invalid JSON" } }));

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const apiRequest = async (path, options = {}) => {
  const { role, token } = options;
  const authToken = token || getTokenForRole(role);
  const headers = {
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return rawRequest(path, {
    method: options.method,
    body: options.body,
    headers,
  });
};

export const ensureRoleToken = async (role) => {
  const existing = getTokenForRole(role);
  if (existing) {
    return existing;
  }

  if (typeof window === "undefined") {
    throw new Error("Missing auth token");
  }

  const pastedToken = window.prompt(
    `Paste JWT for role "${role}" (leave blank to login/register)`
  );
  if (pastedToken) {
    storeAuthToken(pastedToken, role);
    return pastedToken;
  }

  if (!role || role === "admin") {
    throw new Error("Admin token required");
  }

  const email = window.prompt(`Email for ${role} login`);
  if (!email) {
    throw new Error("Login cancelled");
  }
  const password = window.prompt("Password");
  if (!password) {
    throw new Error("Login cancelled");
  }

  try {
    const loginPayload = await rawRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const token = loginPayload?.data?.access_token;
    const user = loginPayload?.data?.user;
    if (!token) {
      throw new Error("Login failed");
    }
    storeAuthToken(token, role);
    storeAuthUser(user);
    return token;
  } catch (err) {
    const shouldRegister = window.confirm(
      "Login failed. Register a new account?"
    );
    if (!shouldRegister) {
      throw err;
    }

    const name = window.prompt("Full name");
    if (!name) {
      throw new Error("Register cancelled");
    }

    await rawRequest("/auth/register", {
      method: "POST",
      body: { name, email, password, role },
    });

    const loginPayload = await rawRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const token = loginPayload?.data?.access_token;
    const user = loginPayload?.data?.user;
    if (!token) {
      throw new Error("Login failed");
    }
    storeAuthToken(token, role);
    storeAuthUser(user);
    return token;
  }
};
