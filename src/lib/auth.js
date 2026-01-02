export const AUTH_TOKEN_KEY = "cashback_auth_token";
export const AUTH_CHANGE_EVENT = "cashback-auth-change";

export const dispatchAuthChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const storeAuthToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  dispatchAuthChange();
};

export const clearAuthToken = () => {
  storeAuthToken(null);
};
