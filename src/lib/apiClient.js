// API base URL can be overridden via VITE_API_BASE_URL; default uses backend in dev.
const DEV_DEFAULT_API = "http://localhost:5000";
const ENV_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const BASE_URL = ENV_BASE_URL || (import.meta.env.DEV ? DEV_DEFAULT_API : "");

const buildUrl = (path, baseOverride = BASE_URL) => {
  if (!path.startsWith("/")) {
    throw new Error("API path must start with /");
  }
  return `${baseOverride}${path}`;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

export const apiRequest = async (path, { method = "GET", body, token, headers } = {}) => {
  const requestHeaders = {
    ...(headers || {}),
  };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const primaryUrl = buildUrl(path);
  const response = await fetch(primaryUrl, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
