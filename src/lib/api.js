import { apiRequest } from "./apiClient";

export const sendOtp = (phoneNumber) =>
  apiRequest("/api/auth/send-otp", {
    method: "POST",
    body: { phoneNumber },
  });

export const verifyOtp = (phoneNumber, otp) =>
  apiRequest("/api/auth/verify-otp", {
    method: "POST",
    body: { phoneNumber, otp },
  });

export const getUserDashboard = (token) =>
  apiRequest("/api/user/dashboard", {
    token,
  });

export const scanQr = (token, hash) =>
  apiRequest(`/api/user/scan-qr/${encodeURIComponent(hash)}`, {
    method: "POST",
    token,
  });

export const loginWithEmail = (email, password) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const getMe = (token) =>
  apiRequest("/api/auth/me", {
    token,
  });

export const getVendorWallet = (token) =>
  apiRequest("/api/vendor/wallet", {
    token,
  });

export const rechargeVendorWallet = (token, amount) =>
  apiRequest("/api/vendor/wallet/recharge", {
    method: "POST",
    token,
    body: { amount },
  });

export const orderVendorQrs = (token, campaignId, quantity) =>
  apiRequest("/api/vendor/qrs/order", {
    method: "POST",
    token,
    body: { campaignId, quantity },
  });

export const getVendorQrs = (token) =>
  apiRequest("/api/vendor/qrs", {
    token,
  });

export const verifyPublicQr = (hash) =>
  apiRequest(`/api/public/qrs/${encodeURIComponent(hash)}`);

export const getVendorProfile = (token) =>
  apiRequest("/api/vendor/profile", {
    token,
  });

export const updateVendorProfile = (token, payload) =>
  apiRequest("/api/vendor/profile", {
    method: "PUT",
    token,
    body: payload,
  });

export const getVendorBrand = (token) =>
  apiRequest("/api/vendor/brand", {
    token,
  });

export const upsertVendorBrand = (token, payload) =>
  apiRequest("/api/vendor/brand", {
    method: "POST",
    token,
    body: payload,
  });

export const getVendorCampaigns = (token) =>
  apiRequest("/api/vendor/campaigns", {
    token,
  });

export const createVendorCampaign = (token, payload) =>
  apiRequest("/api/vendor/campaigns", {
    method: "POST",
    token,
    body: payload,
  });
