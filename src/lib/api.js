import { apiRequest } from "./apiClient";

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return "";
  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
};

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

export const getVendorQrs = (token, params) =>
  apiRequest(`/api/vendor/qrs${buildQueryString(params)}`, {
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

export const getAdminVendors = (token, params) =>
  apiRequest(`/api/admin/vendors${buildQueryString(params)}`, {
    token,
  });

export const getAdminBrands = (token, params) =>
  apiRequest(`/api/admin/brands${buildQueryString(params)}`, {
    token,
  });

export const getAdminCampaigns = (token, paramsOrType) => {
  const params = typeof paramsOrType === "string" ? { type: paramsOrType } : paramsOrType;
  return apiRequest(`/api/admin/campaigns${buildQueryString(params)}`, {
    token,
  });
};

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

export const updateAdminBrandStatus = (token, brandId, payload) =>
  apiRequest(`/api/admin/brands/${brandId}/verify`, {
    method: "PUT",
    token,
    body: payload,
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

export const updateAdminCampaignDetails = (token, campaignId, payload) =>
  apiRequest(`/api/admin/campaigns/${campaignId}`, {
    method: "PUT",
    token,
    body: payload,
  });

export const getAdminCampaignAnalytics = (token, campaignId) =>
  apiRequest(`/api/admin/campaigns/${campaignId}/analytics`, {
    token,
  });

export const deleteAdminCampaign = (token, campaignId) =>
  apiRequest(`/api/admin/campaigns/${campaignId}`, {
    method: "DELETE",
    token,
  });

export const getAdminTransactions = (token) =>
  apiRequest("/api/admin/transactions", {
    token,
  });

export const getAdminTransactionsFiltered = (token, params) =>
  apiRequest(`/api/admin/transactions${buildQueryString(params)}`, {
    token,
  });

export const getAdminQrs = (token, params) =>
  apiRequest(`/api/admin/qrs${buildQueryString(params)}`, {
    token,
  });

export const getAdminQrBatch = (token, params) =>
  apiRequest(`/api/admin/qrs/batch${buildQueryString(params)}`, {
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

export const getAdminNotifications = (token) =>
  apiRequest("/api/admin/notifications", {
    token,
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

export const getAdminVendorOverview = (token, vendorId) =>
  apiRequest(`/api/admin/vendors/${vendorId}/overview`, {
    token,
  });

export const updateAdminVendorDetails = (token, vendorId, payload) =>
  apiRequest(`/api/admin/vendors/${vendorId}`, {
    method: "PUT",
    token,
    body: payload,
  });

export const getAdminBrandOverview = (token, brandId) =>
  apiRequest(`/api/admin/brands/${brandId}`, {
    token,
  });

export const updateAdminBrandDetails = (token, brandId, payload) =>
  apiRequest(`/api/admin/brands/${brandId}`, {
    method: "PUT",
    token,
    body: payload,
  });

export const adjustVendorWalletAdmin = (token, payload) =>
  apiRequest("/api/admin/wallets/adjust", {
    method: "POST",
    token,
    body: payload,
  });

// --- Vendor Order APIs ---
export const getVendorOrders = (token, params) =>
  apiRequest(`/api/vendor/orders${buildQueryString(params)}`, {
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
export const getAdminOrders = (token, params) =>
  apiRequest(`/api/admin/orders${buildQueryString(params)}`, {
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

// --- Public APIs ---
export const getPublicHome = () => apiRequest("/api/public/home");

export const getPublicProducts = (params) =>
  apiRequest(`/api/public/products${buildQueryString(params)}`);

export const getPublicProductDetails = (productId) =>
  apiRequest(`/api/public/products/${encodeURIComponent(productId)}`);

export const getPublicCategories = () => apiRequest("/api/public/categories");

export const getPublicBrands = () => apiRequest("/api/public/brands");

export const getPublicBrandDetails = (brandId) =>
  apiRequest(`/api/public/brands/${encodeURIComponent(brandId)}`);

export const getPublicFaqs = () => apiRequest("/api/public/faqs");

export const getPublicContent = (slug) =>
  apiRequest(`/api/public/content/${encodeURIComponent(slug)}`);

export const getPublicGiftCardCategories = () =>
  apiRequest("/api/public/giftcards/categories");

export const getPublicGiftCards = (params) =>
  apiRequest(`/api/public/giftcards${buildQueryString(params)}`);

export const getPublicGiftCardDetails = (giftCardId) =>
  apiRequest(`/api/public/giftcards/${encodeURIComponent(giftCardId)}`);

export const getPublicStoreData = () => apiRequest("/api/public/store");
