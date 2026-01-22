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

export const loginWithEmail = (email, password, username) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password, username },
  });

export const getMe = (token) =>
  apiRequest("/api/auth/me", {
    token,
  });

export const updateUserProfile = (token, payload) =>
  apiRequest("/api/user/profile", {
    method: "PUT",
    token,
    body: payload,
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

export const orderVendorQrs = (token, campaignId, quantity, cashbackAmount) =>
  apiRequest("/api/vendor/qrs/order", {
    method: "POST",
    token,
    body: { campaignId, quantity, cashbackAmount },
  });

export const getVendorQrs = (token) =>
  apiRequest("/api/vendor/qrs", {
    token,
  });

export const deleteVendorQrBatch = (token, campaignId, cashbackAmount) =>
  apiRequest(
    `/api/vendor/qrs/batch?campaignId=${encodeURIComponent(campaignId)}&cashbackAmount=${encodeURIComponent(
      cashbackAmount ?? ""
    )}`,
    {
      method: "DELETE",
      token,
      body: { campaignId, cashbackAmount },
    }
  );

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

export const getVendorBrands = (token) =>
  apiRequest("/api/vendor/brands", {
    token,
  });

export const getVendorProducts = (token) =>
  apiRequest("/api/vendor/products", {
    token,
  });

export const addVendorProduct = (token, payload) =>
  apiRequest("/api/vendor/products", {
    method: "POST",
    token,
    body: payload,
  });

export const importVendorProducts = (token, payload) =>
  apiRequest("/api/vendor/products/import", {
    method: "POST",
    token,
    body: payload,
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

export const updateVendorCampaign = (token, campaignId, payload) =>
  apiRequest(`/api/vendor/campaigns/${campaignId}`, {
    method: "PUT",
    token,
    body: payload,
  });

export const deleteVendorCampaign = (token, campaignId) =>
  apiRequest(`/api/vendor/campaigns/${campaignId}`, {
    method: "DELETE",
    token,
  });

export const getAdminDashboard = (token) =>
  apiRequest("/api/admin/dashboard", {
    token,
  });

export const getAdminUsers = (token) =>
  apiRequest("/api/admin/users", {
    token,
  });

export const updateAdminUserStatus = (token, userId, status) =>
  apiRequest(`/api/admin/users/${userId}/status`, {
    method: "PUT",
    token,
    body: { status },
  });

export const getAdminVendors = (token) =>
  apiRequest("/api/admin/vendors", {
    token,
  });

export const createAdminBrand = (token, payload) =>
  apiRequest("/api/admin/brands", {
    method: "POST",
    token,
    body: payload,
  });

export const updateAdminVendorStatus = (token, vendorId, status) =>
  apiRequest(`/api/admin/vendors/${vendorId}/verify`, {
    method: "PUT",
    token,
    body: { status },
  });

export const creditVendorWalletAdmin = (token, payload) =>
  apiRequest("/api/admin/wallets/credit", {
    method: "POST",
    token,
    body: payload,
  });

export const updateAdminCampaignStatus = (token, campaignId, status) =>
  apiRequest(`/api/admin/campaigns/${campaignId}/status`, {
    method: "PUT",
    token,
    body: { status },
  });

export const getAdminTransactions = (token) =>
  apiRequest("/api/admin/transactions", {
    token,
  });

export const getAdminQrs = (token) =>
  apiRequest("/api/admin/qrs", {
    token,
  });

export const getAdminWithdrawals = (token) =>
  apiRequest("/api/admin/withdrawals", {
    token,
  });

export const processAdminWithdrawal = (token, withdrawalId, payload) =>
  apiRequest(`/api/admin/withdrawals/${withdrawalId}/process`, {
    method: "PUT",
    token,
    body: payload,
  });

export const getAdminSubscriptions = (token, status) =>
  apiRequest(`/api/admin/subscriptions${status ? `?status=${status}` : ""}`, {
    token,
  });

export const updateAdminVendorSubscription = (token, vendorId, payload) =>
  apiRequest(`/api/admin/vendors/${vendorId}/subscription`, {
    method: "PUT",
    token,
    body: payload,
  });

// --- Vendor Order APIs ---
export const getVendorOrders = (token) =>
  apiRequest("/api/vendor/orders", {
    token,
  });

export const createVendorOrder = (token, campaignId, quantity, cashbackAmount) =>
  apiRequest("/api/vendor/orders", {
    method: "POST",
    token,
    body: { campaignId, quantity, cashbackAmount },
  });

export const payVendorOrder = (token, orderId) =>
  apiRequest(`/api/vendor/orders/${orderId}/pay`, {
    method: "POST",
    token,
  });

// --- Admin Order APIs ---
export const getAdminOrders = (token) =>
  apiRequest("/api/admin/orders", {
    token,
  });

export const updateAdminOrderStatus = (token, orderId, status) =>
  apiRequest(`/api/admin/orders/${orderId}/status`, {
    method: "PUT",
    token,
    body: { status },
  });

export const payVendorCampaign = (token, campaignId) =>
  apiRequest(`/api/vendor/campaigns/${campaignId}/pay`, {
    method: "POST",
    token,
  });
