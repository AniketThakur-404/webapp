import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LogOut,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import {
  getMe,
  getVendorQrs,
  getVendorWallet,
  getVendorBrand,
  getVendorCampaigns,
  getVendorProfile,
  loginWithEmail,
  createVendorCampaign,
  orderVendorQrs,
  rechargeVendorWallet,
  scanQr,
  upsertVendorBrand,
  updateVendorProfile,
  verifyPublicQr,
} from "../lib/api";

const VENDOR_TOKEN_KEY = "cashback_vendor_token";

const formatAmount = (value) => {
  if (value === undefined || value === null) return "0.00";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric.toFixed(2);
  return String(value);
};

const VendorDashboard = () => {
  const [token, setToken] = useState(() => localStorage.getItem(VENDOR_TOKEN_KEY));
  const [vendorInfo, setVendorInfo] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState("");
  const [walletStatus, setWalletStatus] = useState("");
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);

  const [campaignId, setCampaignId] = useState("");
  const [qrQuantity, setQrQuantity] = useState("25");
  const [qrOrderStatus, setQrOrderStatus] = useState("");
  const [qrOrderError, setQrOrderError] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [lastOrderHashes, setLastOrderHashes] = useState([]);

  const [qrs, setQrs] = useState([]);
  const [qrError, setQrError] = useState("");
  const [isLoadingQrs, setIsLoadingQrs] = useState(false);

  const [scanHash, setScanHash] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [scanError, setScanError] = useState("");
  const [verifyData, setVerifyData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activeQr, setActiveQr] = useState(null);
  const [qrActionStatus, setQrActionStatus] = useState("");
  const qrCarouselRef = useRef(null);
  const [showAllInventory, setShowAllInventory] = useState(false);

  const [companyProfile, setCompanyProfile] = useState({
    businessName: "",
    contactPhone: "",
    gstin: "",
    address: "",
  });
  const [brandProfile, setBrandProfile] = useState({
    name: "",
    logoUrl: "",
    website: "",
  });
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [isSavingRegistration, setIsSavingRegistration] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    cashbackAmount: "",
    startDate: "",
    endDate: "",
    totalBudget: "",
  });
  const [campaignStatus, setCampaignStatus] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);

  const isAuthenticated = Boolean(token);

  const getQrValue = (hash) => {
    const envBase = import.meta.env.VITE_QR_BASE_URL;
    if (envBase) {
      return `${envBase.replace(/\/$/, "")}/api/public/qrs/${hash}`;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/public/qrs/${hash}`;
    }
    return hash;
  };

  const getQrCanvasId = (hash) => `qr-canvas-${hash}`;

  const setStatusWithTimeout = (message) => {
    setQrActionStatus(message);
    setTimeout(() => setQrActionStatus(""), 2000);
  };

  const getStatusClasses = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "redeemed") return "text-emerald-600 dark:text-emerald-400";
    if (normalized === "expired") return "text-rose-600 dark:text-rose-400";
    if (normalized === "assigned") return "text-amber-600 dark:text-amber-400";
    if (normalized === "generated" || normalized === "active") {
      return "text-blue-600 dark:text-blue-400";
    }
    return "text-gray-500 dark:text-gray-400";
  };

  const copyToClipboard = async (value) => {
    const textValue = String(value ?? "");
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textValue);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textValue;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCopyHash = async (hash) => {
    const ok = await copyToClipboard(hash);
    setStatusWithTimeout(ok ? "QR hash copied." : "Unable to copy QR hash.");
  };

  const handleCopyCampaignId = async (campaignIdValue) => {
    const ok = await copyToClipboard(campaignIdValue);
    setCampaignStatusWithTimeout(ok ? "Campaign ID copied." : "Unable to copy campaign ID.");
  };

  const handleDownloadQr = (hash) => {
    const canvas = document.getElementById(getQrCanvasId(hash));
    if (!canvas) {
      setStatusWithTimeout("QR not ready yet.");
      return;
    }
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-${hash.slice(0, 8)}.png`;
    link.click();
  };

  const handlePrintQr = (hash) => {
    const canvas = document.getElementById(getQrCanvasId(hash));
    if (!canvas) {
      setStatusWithTimeout("QR not ready yet.");
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=480,height=520");
    if (!printWindow) {
      setStatusWithTimeout("Popup blocked.");
      return;
    }
    printWindow.document.write(
      `<html><head><title>Print QR</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;"><img src="${dataUrl}" style="width:320px;height:320px;" /></body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  const clearSession = (message) => {
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    setToken(null);
    setVendorInfo(null);
    setAuthStatus(message || "");
  };

  const loadVendor = async (authToken) => {
    try {
      const data = await getMe(authToken);
      if (data?.role && data.role !== "vendor") {
        clearSession("This account is not a vendor.");
        setAuthError("This account is not a vendor.");
        return;
      }
      setVendorInfo(data);
    } catch (err) {
      if (err.status === 401) {
        clearSession("Session expired.");
      } else {
        setAuthError(err.message || "Unable to load vendor profile.");
      }
    }
  };

  const loadWallet = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingWallet(true);
    setWalletError("");
    try {
      const data = await getVendorWallet(authToken);
      setWallet(data);
    } catch (err) {
      if (err.status === 401) {
        clearSession("Session expired.");
      } else if (err.status === 404) {
        setWallet(null);
      } else {
        setWalletError(err.message || "Unable to load wallet.");
      }
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const loadQrs = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingQrs(true);
    setQrError("");
    try {
      const data = await getVendorQrs(authToken);
      setQrs(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) {
        clearSession("Session expired.");
      } else if (err.status === 404) {
        setQrs([]);
      } else {
        setQrError(err.message || "Unable to load QR inventory.");
      }
    } finally {
      setIsLoadingQrs(false);
    }
  };

  const loadCompanyProfile = async (authToken = token) => {
    if (!authToken) return;
    setRegistrationError("");
    try {
      const data = await getVendorProfile(authToken);
      setCompanyProfile({
        businessName: data.businessName || "",
        contactPhone: data.contactPhone || "",
        gstin: data.gstin || "",
        address: data.address || "",
      });
    } catch (err) {
      if (err.status === 401) {
        clearSession("Session expired.");
      } else if (err.status === 404) {
        setCompanyProfile({
          businessName: "",
          contactPhone: "",
          gstin: "",
          address: "",
        });
      } else {
        setRegistrationError(err.message || "Unable to load company profile.");
      }
    }
  };

  const loadBrandProfile = async (authToken = token) => {
    if (!authToken) return;
    setRegistrationError("");
    try {
      const data = await getVendorBrand(authToken);
      setBrandProfile({
        name: data.name || "",
        logoUrl: data.logoUrl || "",
        website: data.website || "",
      });
    } catch (err) {
      if (err.status === 401) {
        clearSession("Session expired.");
      } else if (err.status === 404) {
        setBrandProfile({
          name: "",
          logoUrl: "",
          website: "",
        });
      } else {
        setRegistrationError(err.message || "Unable to load brand profile.");
      }
    }
  };

  const loadCampaigns = async (authToken = token) => {
    if (!authToken) return;
    setCampaignError("");
    try {
      const data = await getVendorCampaigns(authToken);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) {
        clearSession("Session expired.");
      } else if (err.status === 404) {
        setCampaigns([]);
      } else {
        setCampaignError(err.message || "Unable to load campaigns.");
      }
    }
  };

  useEffect(() => {
    if (!token) return;
    loadVendor(token);
    loadWallet(token);
    loadQrs(token);
    loadCompanyProfile(token);
    loadBrandProfile(token);
    loadCampaigns(token);
  }, [token]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setAuthError("Enter email and password to continue.");
      return;
    }
    setAuthError("");
    setAuthStatus("");
    setIsSigningIn(true);
    try {
      const data = await loginWithEmail(email.trim(), password);
      if (data.role !== "vendor") {
        throw new Error("This account is not a vendor.");
      }
      localStorage.setItem(VENDOR_TOKEN_KEY, data.token);
      setToken(data.token);
      setVendorInfo({ name: data.name, email: data.email, role: data.role });
      setEmail("");
      setPassword("");
      setAuthStatus("Signed in successfully.");
    } catch (err) {
      setAuthError(err.message || "Sign in failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = () => {
    clearSession("Signed out.");
    setWallet(null);
    setQrs([]);
    setScanHash("");
    setScanStatus("");
    setScanError("");
    setVerifyData(null);
    setCompanyProfile({
      businessName: "",
      contactPhone: "",
      gstin: "",
      address: "",
    });
    setBrandProfile({
      name: "",
      logoUrl: "",
      website: "",
    });
    setCampaigns([]);
    setCampaignId("");
  };

  const handleRecharge = async () => {
    const amountValue = parseFloat(rechargeAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setWalletError("Enter a valid recharge amount.");
      return;
    }
    setIsRecharging(true);
    setWalletError("");
    setWalletStatus("");
    try {
      await rechargeVendorWallet(token, amountValue);
      setWalletStatus("Wallet recharged successfully.");
      setRechargeAmount("");
      await loadWallet();
    } catch (err) {
      setWalletError(err.message || "Recharge failed.");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleOrderQrs = async () => {
    const quantityValue = parseInt(qrQuantity, 10);
    if (!campaignId.trim()) {
      setQrOrderError("Enter a campaign ID.");
      return;
    }
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setQrOrderError("Enter a valid quantity.");
      return;
    }
    setIsOrdering(true);
    setQrOrderError("");
    setQrOrderStatus("");
    try {
      const result = await orderVendorQrs(token, campaignId.trim(), quantityValue);
      setQrOrderStatus(`Generated ${result.count} QRs successfully.`);
      setLastOrderHashes(
        Array.isArray(result.qrs)
          ? result.qrs.slice(0, 5).map((item) => item.uniqueHash)
          : []
      );
      setCampaignId("");
      await loadWallet();
      await loadQrs();
    } catch (err) {
      setQrOrderError(err.message || "QR generation failed.");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleVerifyQr = async () => {
    if (!scanHash.trim()) {
      setScanError("Enter a QR hash to verify.");
      return;
    }
    setIsVerifying(true);
    setScanError("");
    setScanStatus("");
    setVerifyData(null);
    try {
      const data = await verifyPublicQr(scanHash.trim());
      setVerifyData(data);
      setScanStatus("QR verified.");
    } catch (err) {
      setScanError(err.message || "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRedeemQr = async () => {
    const trimmedHash = scanHash.trim();
    if (!trimmedHash) {
      setScanError("Enter a QR hash to redeem.");
      return;
    }
    setIsRedeeming(true);
    setScanError("");
    setScanStatus("");
    try {
      const result = await scanQr(token, trimmedHash);
      setScanStatus(`Redeemed. Added INR ${formatAmount(result.amount)} to wallet.`);
      setQrs((prev) =>
        prev.map((qr) =>
          qr.uniqueHash === trimmedHash ? { ...qr, status: "redeemed" } : qr
        )
      );
      setScanHash("");
      await loadWallet();
      await loadQrs();
    } catch (err) {
      setScanError(err.message || "Redemption failed.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCompanyChange = (field) => (event) => {
    setCompanyProfile((prev) => ({ ...prev, [field]: event.target.value }));
    setRegistrationStatus("");
    setRegistrationError("");
  };

  const handleBrandChange = (field) => (event) => {
    setBrandProfile((prev) => ({ ...prev, [field]: event.target.value }));
    setRegistrationStatus("");
    setRegistrationError("");
  };

  const handleRegistrationSave = async () => {
    if (!companyProfile.businessName.trim()) {
      setRegistrationError("Company name is required.");
      return;
    }
    if (!brandProfile.name.trim()) {
      setRegistrationError("Brand name is required.");
      return;
    }
    setRegistrationError("");
    setRegistrationStatus("");
    setIsSavingRegistration(true);
    try {
      await updateVendorProfile(token, {
        businessName: companyProfile.businessName.trim(),
        contactPhone: companyProfile.contactPhone.trim() || null,
        gstin: companyProfile.gstin.trim() || null,
        address: companyProfile.address.trim() || null,
      });
      await upsertVendorBrand(token, {
        name: brandProfile.name.trim(),
        logoUrl: brandProfile.logoUrl.trim() || null,
        website: brandProfile.website.trim() || null,
      });
      setRegistrationStatus("Brand registration saved.");
      await loadCompanyProfile();
      await loadBrandProfile();
      await loadCampaigns();
    } catch (err) {
      setRegistrationError(err.message || "Unable to save registration.");
    } finally {
      setIsSavingRegistration(false);
    }
  };

  const handleCampaignChange = (field) => (event) => {
    setCampaignForm((prev) => ({ ...prev, [field]: event.target.value }));
    setCampaignStatus("");
    setCampaignError("");
  };

  const setCampaignStatusWithTimeout = (message) => {
    setCampaignStatus(message);
    setTimeout(() => setCampaignStatus(""), 2000);
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.title.trim()) {
      setCampaignError("Campaign title is required.");
      return;
    }
    const cashbackValue = parseFloat(campaignForm.cashbackAmount);
    if (!Number.isFinite(cashbackValue) || cashbackValue <= 0) {
      setCampaignError("Enter a valid cashback amount.");
      return;
    }
    if (!campaignForm.startDate || !campaignForm.endDate) {
      setCampaignError("Start and end dates are required.");
      return;
    }
    const budgetValue = campaignForm.totalBudget.trim()
      ? parseFloat(campaignForm.totalBudget)
      : null;
    if (campaignForm.totalBudget.trim() && (!Number.isFinite(budgetValue) || budgetValue <= 0)) {
      setCampaignError("Enter a valid total budget or leave it empty.");
      return;
    }
    setCampaignError("");
    setCampaignStatus("");
    setIsSavingCampaign(true);
    try {
      const campaign = await createVendorCampaign(token, {
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim() || null,
        cashbackAmount: cashbackValue,
        startDate: campaignForm.startDate,
        endDate: campaignForm.endDate,
        totalBudget: budgetValue,
      });
      setCampaignStatusWithTimeout("Campaign created.");
      setCampaignForm({
        title: "",
        description: "",
        cashbackAmount: "",
        startDate: "",
        endDate: "",
        totalBudget: "",
      });
      setCampaignId(campaign.id);
      await loadCampaigns();
    } catch (err) {
      setCampaignError(err.message || "Campaign creation failed.");
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const qrStats = useMemo(() => {
    const total = qrs.length;
    const redeemed = qrs.filter((qr) => qr.status === "redeemed").length;
    const activeStatuses = new Set(["generated", "assigned", "active"]);
    const active = qrs.filter((qr) => activeStatuses.has(qr.status)).length;
    return { total, redeemed, active };
  }, [qrs]);

  const recentQrs = useMemo(() => {
    return [...qrs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);
  }, [qrs]);

  const qrGallery = useMemo(() => {
    return [...qrs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [qrs]);

  const inventoryQrs = useMemo(() => {
    return showAllInventory ? qrGallery : recentQrs;
  }, [showAllInventory, qrGallery, recentQrs]);

  const walletBalance = wallet?.balance;
  const lockedBalance = wallet?.lockedBalance;

  return (
    <div className="p-4 pb-24 space-y-4 bg-blue-50/60 dark:bg-zinc-950 min-h-full transition-colors duration-300">
      {!isAuthenticated && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <ShieldCheck size={16} className="text-blue-600" />
            Vendor access
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vendor@brand.com"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full rounded-xl bg-blue-600 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
          >
            {isSigningIn ? "Signing in..." : "Sign in"}
          </button>
          {authStatus && (
            <div className="text-xs text-green-600 font-semibold">{authStatus}</div>
          )}
          {authError && <div className="text-xs text-red-600 font-semibold">{authError}</div>}
        </div>
      )}

      {isAuthenticated && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <Store size={16} className="text-blue-600" />
                Vendor dashboard
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {vendorInfo?.name || "Vendor account"}
              {vendorInfo?.email ? ` - ${vendorInfo.email}` : ""}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-blue-50/60 dark:bg-zinc-900 p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Wallet</div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  INR {formatAmount(walletBalance)}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-blue-50/60 dark:bg-zinc-900 p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Active QRs</div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {qrStats.active}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-blue-50/60 dark:bg-zinc-900 p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Redeemed</div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {qrStats.redeemed}
                </div>
              </div>
            </div>
          {authStatus && (
            <div className="text-xs text-green-600 font-semibold">{authStatus}</div>
          )}
          {authError && <div className="text-xs text-red-600 font-semibold">{authError}</div>}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <Store size={16} className="text-blue-600" />
            Brand registration
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Register your company and brand before creating campaigns.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Company name
              </label>
              <input
                type="text"
                value={companyProfile.businessName}
                onChange={handleCompanyChange("businessName")}
                placeholder="Legal company name"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Brand name
              </label>
              <input
                type="text"
                value={brandProfile.name}
                onChange={handleBrandChange("name")}
                placeholder="Brand display name"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Logo URL
              </label>
              <input
                type="text"
                value={brandProfile.logoUrl}
                onChange={handleBrandChange("logoUrl")}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Website
              </label>
              <input
                type="text"
                value={brandProfile.website}
                onChange={handleBrandChange("website")}
                placeholder="https://brand.com"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Contact phone
              </label>
              <input
                type="tel"
                value={companyProfile.contactPhone}
                onChange={handleCompanyChange("contactPhone")}
                placeholder="Primary contact"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                GSTIN
              </label>
              <input
                type="text"
                value={companyProfile.gstin}
                onChange={handleCompanyChange("gstin")}
                placeholder="GSTIN"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Registered address
            </label>
            <textarea
              rows="3"
              value={companyProfile.address}
              onChange={handleCompanyChange("address")}
              placeholder="Full registered address"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={handleRegistrationSave}
            disabled={isSavingRegistration}
            className="w-full rounded-xl bg-blue-600 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
          >
            {isSavingRegistration ? "Saving..." : "Save registration"}
          </button>
          {registrationStatus && (
            <div className="text-xs text-green-600 font-semibold">{registrationStatus}</div>
          )}
          {registrationError && (
            <div className="text-xs text-red-600 font-semibold">{registrationError}</div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <BadgeCheck size={16} className="text-blue-600" />
              Campaigns
            </div>
            <button
              type="button"
              onClick={() => loadCampaigns()}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Campaign title
            </label>
            <input
              type="text"
              value={campaignForm.title}
              onChange={handleCampaignChange("title")}
              placeholder="e.g. Diwali Cashback"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Description
            </label>
            <textarea
              rows="2"
              value={campaignForm.description}
              onChange={handleCampaignChange("description")}
              placeholder="Short campaign summary"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Cashback amount (INR)
              </label>
              <input
                type="number"
                min="1"
                value={campaignForm.cashbackAmount}
                onChange={handleCampaignChange("cashbackAmount")}
                placeholder="e.g. 50"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Total budget (optional)
              </label>
              <input
                type="number"
                min="1"
                value={campaignForm.totalBudget}
                onChange={handleCampaignChange("totalBudget")}
                placeholder="e.g. 100000"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Start date
              </label>
              <input
                type="date"
                value={campaignForm.startDate}
                onChange={handleCampaignChange("startDate")}
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                End date
              </label>
              <input
                type="date"
                value={campaignForm.endDate}
                onChange={handleCampaignChange("endDate")}
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateCampaign}
            disabled={isSavingCampaign}
            className="w-full rounded-xl bg-gray-900 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            {isSavingCampaign ? "Creating..." : "Create campaign"}
          </button>
          {campaignStatus && (
            <div className="text-xs text-green-600 font-semibold">{campaignStatus}</div>
          )}
          {campaignError && (
            <div className="text-xs text-red-600 font-semibold">{campaignError}</div>
          )}
          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                No campaigns yet.
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-zinc-800 px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {campaign.title}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      INR {formatAmount(campaign.cashbackAmount)} · {campaign.status}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {campaign.id.slice(0, 10)}...
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setCampaignId(campaign.id)}
                        className="text-blue-600 dark:text-blue-400"
                      >
                        Use
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCampaignId(campaign.id)}
                        className="text-gray-600 dark:text-gray-300"
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <Wallet size={16} className="text-blue-600" />
            Wallet controls
          </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Balance</div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  INR {formatAmount(walletBalance)}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  Locked balance
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  INR {formatAmount(lockedBalance)}
                </div>
              </div>
            </div>
            {isLoadingWallet && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Loading wallet...</div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Recharge amount
              </label>
              <input
                type="number"
                min="1"
                value={rechargeAmount}
                onChange={(event) => setRechargeAmount(event.target.value)}
                placeholder="Enter amount in INR"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleRecharge}
                disabled={isRecharging}
                className="w-full rounded-xl bg-gray-900 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60 dark:bg-white dark:text-gray-900"
              >
                {isRecharging ? "Recharging..." : "Recharge wallet"}
              </button>
            </div>
            {walletStatus && (
              <div className="text-xs text-green-600 font-semibold">{walletStatus}</div>
            )}
            {walletError && <div className="text-xs text-red-600 font-semibold">{walletError}</div>}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <QrCode size={16} className="text-blue-600" />
              Generate QR batch
            </div>
            {campaigns.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                No campaigns yet. Create a campaign to generate QRs.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Select campaign
                </label>
                <select
                  value={campaignId}
                  onChange={(event) => setCampaignId(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a campaign</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Campaign ID
              </label>
              <input
                type="text"
                value={campaignId}
                onChange={(event) => setCampaignId(event.target.value)}
                placeholder="Paste campaign ID"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={qrQuantity}
                onChange={(event) => setQrQuantity(event.target.value)}
                placeholder="Number of QRs"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleOrderQrs}
                disabled={isOrdering}
                className="w-full rounded-xl bg-blue-600 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
              >
                {isOrdering ? "Generating..." : "Generate QRs"}
              </button>
            </div>
            {qrOrderStatus && (
              <div className="text-xs text-green-600 font-semibold">{qrOrderStatus}</div>
            )}
            {qrOrderError && <div className="text-xs text-red-600 font-semibold">{qrOrderError}</div>}
            {lastOrderHashes.length > 0 && (
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-3 space-y-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Latest QR hashes
                </div>
                {lastOrderHashes.map((hash) => (
                  <div key={hash} className="flex items-center justify-between gap-2">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 break-all">
                      {hash}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyHash(hash)}
                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveQr({ uniqueHash: hash, Campaign: { title: "QR Preview" } })}
                        className="text-[10px] font-semibold text-gray-600 dark:text-gray-300"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <ClipboardCheck size={16} className="text-blue-600" />
                QR inventory
              </div>
              <button
                type="button"
                onClick={() => loadQrs()}
                disabled={isLoadingQrs}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
            {isLoadingQrs && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Loading QRs...</div>
            )}
            {qrError && <div className="text-xs text-red-600 font-semibold">{qrError}</div>}
            {!isLoadingQrs && inventoryQrs.length === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                No QR batches yet.
              </div>
            )}
            {qrStats.total > 0 && (
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                <span>
                  Showing {inventoryQrs.length} of {qrStats.total}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllInventory((prev) => !prev)}
                  className="font-semibold text-blue-600 dark:text-blue-400"
                >
                  {showAllInventory ? "Show less" : "View all"}
                </button>
              </div>
            )}
            <div
              className={`space-y-2 ${showAllInventory ? "max-h-64 overflow-y-auto pr-1" : ""}`}
            >
              {inventoryQrs.map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-zinc-800 px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {qr.Campaign?.title || "Campaign"}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {qr.uniqueHash.slice(0, 12)}...
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`text-[10px] font-semibold ${getStatusClasses(qr.status)}`}>
                      {qr.status}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveQr(qr)}
                      className="text-[10px] font-semibold text-gray-600 dark:text-gray-300"
                    >
                      View QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <QrCode size={16} className="text-blue-600" />
                QR gallery
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {qrGallery.length} QRs
                </div>
                <button
                  type="button"
                  onClick={() =>
                    qrCarouselRef.current?.scrollBy({ left: -240, behavior: "smooth" })
                  }
                  className="h-7 w-7 rounded-full border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    qrCarouselRef.current?.scrollBy({ left: 240, behavior: "smooth" })
                  }
                  className="h-7 w-7 rounded-full border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {qrGallery.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                No QR codes to preview yet.
              </div>
            ) : (
              <div
                ref={qrCarouselRef}
                className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar"
              >
                {qrGallery.map((qr) => (
                  <div
                    key={qr.id}
                    className="min-w-[170px] snap-start rounded-xl border border-gray-100 dark:border-zinc-800 p-3 bg-gray-50/60 dark:bg-zinc-950"
                  >
                    <div className="flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-2">
                      <QRCodeCanvas
                        id={getQrCanvasId(qr.uniqueHash)}
                        value={getQrValue(qr.uniqueHash)}
                        size={110}
                        level="M"
                        includeMargin
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 break-all">
                      {qr.uniqueHash.slice(0, 16)}...
                    </div>
                    <div className={`mt-1 text-[10px] font-semibold ${getStatusClasses(qr.status)}`}>
                      {qr.status}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setActiveQr(qr)}
                        className="text-blue-600 dark:text-blue-400"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQr(qr.uniqueHash)}
                        className="text-gray-600 dark:text-gray-300"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(qr.uniqueHash)}
                        className="text-gray-600 dark:text-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {qrActionStatus && (
              <div className="text-xs text-green-600 font-semibold">{qrActionStatus}</div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <ScanLine size={16} className="text-blue-600" />
              Scan and redeem
            </div>
            <input
              type="text"
              value={scanHash}
              onChange={(event) => setScanHash(event.target.value)}
              placeholder="Paste QR hash"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleVerifyQr}
                disabled={isVerifying}
                className="w-full rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold py-2 shadow-sm disabled:opacity-60 dark:bg-zinc-800 dark:text-gray-200"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={handleRedeemQr}
                disabled={isRedeeming}
                className="w-full rounded-xl bg-blue-600 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
              >
                {isRedeeming ? "Redeeming..." : "Redeem"}
              </button>
            </div>
            {verifyData && (
              <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <BadgeCheck size={14} className="text-green-600" />
                  {verifyData.campaign || "QR verified"}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {verifyData.brand} - INR {formatAmount(verifyData.amount)}
                </div>
              </div>
            )}
            {scanStatus && (
              <div className="text-xs text-green-600 font-semibold">{scanStatus}</div>
            )}
            {scanError && <div className="text-xs text-red-600 font-semibold">{scanError}</div>}
          </div>
        </>
      )}

      {activeQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {activeQr.Campaign?.title || "QR preview"}
              </div>
              <button
                type="button"
                onClick={() => setActiveQr(null)}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                Close
              </button>
            </div>
            <div className="flex items-center justify-center rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-950 p-4">
              <QRCodeCanvas
                id={getQrCanvasId(activeQr.uniqueHash)}
                value={getQrValue(activeQr.uniqueHash)}
                size={220}
                level="M"
                includeMargin
              />
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 break-all">
              {activeQr.uniqueHash}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleDownloadQr(activeQr.uniqueHash)}
                className="rounded-xl bg-blue-600 text-white py-2"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => handlePrintQr(activeQr.uniqueHash)}
                className="rounded-xl bg-gray-900 text-white py-2 dark:bg-white dark:text-gray-900"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => handleCopyHash(activeQr.uniqueHash)}
                className="rounded-xl bg-gray-100 text-gray-700 py-2 dark:bg-zinc-800 dark:text-gray-200"
              >
                Copy
              </button>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              Encoded: {getQrValue(activeQr.uniqueHash)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
