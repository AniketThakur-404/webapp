import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import {
  Menu,
  X,
  LayoutDashboard,
  Store,
  BadgeCheck,
  Megaphone,
  Package,
  Wallet,
  QrCode,
  ScanLine,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Plus,
  ArrowRight,
  ClipboardCheck,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  getMe,
  getVendorQrs,
  getVendorWallet,
  getVendorBrand,
  getVendorCampaigns,
  getVendorOrders,
  getVendorProfile,
  getVendorProducts,
  addVendorProduct,
  loginWithEmail,
  createVendorCampaign,
  updateVendorCampaign,
  deleteVendorQrBatch,
  orderVendorQrs,
  rechargeVendorWallet,
  scanQr,
  updateVendorProfile,
  verifyPublicQr,
  payVendorCampaign
} from "../lib/api";
import VendorAnalytics from "../components/VendorAnalytics";
import StarBorder from "../components/StarBorder";
import { ModeToggle } from "../components/ModeToggle";

const VENDOR_TOKEN_KEY = "cashback_vendor_token";
const subscriptionTypeLabels = {
  MONTHS_6: "6 Months",
  MONTHS_12: "12 Months",
  MONTHS_24: "24 Months",
};

const formatAmount = (value) => {
  if (value === undefined || value === null) return "0.00";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric.toFixed(2);
  return String(value);
};

const formatCompactAmount = (value) => {
  if (value === undefined || value === null) return "0.00";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  const abs = Math.abs(numeric);
  const sign = numeric < 0 ? "-" : "";
  const units = [
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "K" },
  ];

  for (const unit of units) {
    if (abs >= unit.value) {
      const compact = abs / unit.value;
      const decimals = compact >= 100 ? 0 : compact >= 10 ? 1 : 2;
      let compactText = compact.toFixed(decimals);
      compactText = compactText.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
      return `${sign}${compactText}${unit.suffix}`;
    }
  }

  return formatAmount(numeric);
};

const formatShortDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd MMM yyyy");
};

const parseNumericValue = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getAllocationRowTotal = (row) => {
  const cashback = parseOptionalNumber(row?.cashbackAmount);
  const quantity = parseOptionalNumber(row?.quantity);
  if (cashback === null || quantity === null) return null;
  return cashback * quantity;
};

const formatAllocationTotal = (row) => {
  const total = getAllocationRowTotal(row);
  return total === null ? "" : total.toFixed(2);
};

const getGeneratedPrice = (qr) => {
  const qrValue = parseNumericValue(qr?.cashbackAmount, 0);
  if (qrValue > 0) {
    return qrValue;
  }
  return parseNumericValue(qr?.Campaign?.cashbackAmount, 0);
};

const buildAllocationGroups = (allocations) => {
  if (!Array.isArray(allocations)) return [];
  const grouped = new Map();

  allocations.forEach((alloc) => {
    const price = parseNumericValue(alloc?.cashbackAmount, 0);
    const quantity = parseInt(alloc?.quantity, 10) || 0;
    const key = price.toFixed(2);
    if (!grouped.has(key)) {
      grouped.set(key, { price, quantity: 0, totalBudget: 0 });
    }
    const group = grouped.get(key);
    const rowBudget = parseNumericValue(alloc?.totalBudget, 0);
    group.quantity += quantity;
    group.totalBudget += rowBudget || price * quantity;
  });

  return Array.from(grouped.values()).sort((a, b) => a.price - b.price);
};

const VendorDashboard = () => {
  const { section } = useParams();
  const navigate = useNavigate();

  // Map URL section to internal state identifiers if necessary, or use directly
  // 'overview', 'brand', 'campaigns', 'products', 'wallet', 'scan'
  const activeTab = section === 'qr-generation' ? 'campaigns' : section || 'overview';

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
  const [qrOrderStatus, setQrOrderStatus] = useState("");
  const [qrOrderError, setQrOrderError] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [lastOrderHashes, setLastOrderHashes] = useState([]);
  const [lastBatchSummary, setLastBatchSummary] = useState(null);
  const [selectedQrCampaign, setSelectedQrCampaign] = useState("");
  const [selectedQrProduct, setSelectedQrProduct] = useState("");
  const [qrRows, setQrRows] = useState([{ id: Date.now(), cashbackAmount: "", quantity: 10 }]);

  const [qrs, setQrs] = useState([]);
  const [qrError, setQrError] = useState("");
  const [isLoadingQrs, setIsLoadingQrs] = useState(false);
  const [deletingBatchKey, setDeletingBatchKey] = useState(null);
  const [qrPage, setQrPage] = useState(1);
  const [qrTotal, setQrTotal] = useState(0);
  const [qrStatusCounts, setQrStatusCounts] = useState({});
  const [qrHasMore, setQrHasMore] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderStatusCounts, setOrderStatusCounts] = useState({});
  const [ordersHasMore, setOrdersHasMore] = useState(false);

  const [scanHash, setScanHash] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [scanError, setScanError] = useState("");
  const [verifyData, setVerifyData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activeQr, setActiveQr] = useState(null);
  const [qrActionStatus, setQrActionStatus] = useState("");
  const qrCarouselRef = useRef(null);
  const lastAutoFilledCashbackRef = useRef(null);
  const [showAllInventory, setShowAllInventory] = useState(false);

  const [companyProfile, setCompanyProfile] = useState({
    businessName: "",
    contactPhone: "",
    gstin: "",
    address: "",
  });

  const [brandProfile, setBrandProfile] = useState({
    id: "",
    name: "",
    logoUrl: "",
    website: "",
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [isSavingRegistration, setIsSavingRegistration] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [overviewCampaignId, setOverviewCampaignId] = useState("all");
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    cashbackAmount: "",
    totalBudget: "",
    productId: "",
  });
  const [campaignStatus, setCampaignStatus] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [campaignRows, setCampaignRows] = useState([{ id: Date.now(), cashbackAmount: "", quantity: "", totalBudget: "" }]);
  const [campaignTab, setCampaignTab] = useState('create'); // 'create', 'pending', 'active'
  const [selectedPendingCampaign, setSelectedPendingCampaign] = useState(null);
  const [selectedActiveCampaign, setSelectedActiveCampaign] = useState(null);
  const [isPayingCampaign, setIsPayingCampaign] = useState(false);

  const handleAddCampaignRow = () => {
    setCampaignRows((prev) => [...prev, { id: Date.now(), cashbackAmount: "", quantity: "", totalBudget: "" }]);
  };

  const handleRemoveCampaignRow = (id) => {
    setCampaignRows((prev) => {
      const remaining = prev.filter((row) => row.id !== id);
      return remaining.length ? remaining : [{ id: Date.now(), cashbackAmount: "", quantity: "", totalBudget: "" }];
    });
  };

  const handleCampaignRowChange = (id, field, value) => {
    setCampaignRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'cashbackAmount' || field === 'quantity') {
            const cb = field === 'cashbackAmount' ? parseFloat(value) : parseFloat(row.cashbackAmount);
            const qty = field === 'quantity' ? parseFloat(value) : parseFloat(row.quantity);
            if (!isNaN(cb) && !isNaN(qty) && cb > 0 && qty > 0) {
              updatedRow.totalBudget = (cb * qty).toFixed(2);
            } else {
              updatedRow.totalBudget = "";
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const campaignAllocationSummary = useMemo(() => {
    return campaignRows.reduce(
      (summary, row) => {
        const quantityValue = parseOptionalNumber(row.quantity);
        const rowTotal = getAllocationRowTotal(row);
        summary.subtotal += rowTotal ?? 0;
        if (Number.isFinite(quantityValue)) {
          summary.quantity += Math.max(0, Math.floor(quantityValue));
        }
        return summary;
      },
      { subtotal: 0, quantity: 0 }
    );
  }, [campaignRows]);


  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({
    name: "",
    variant: "",
    category: "",
    description: "",
    imageUrl: "",
  });
  const [productStatus, setProductStatus] = useState("");
  const [productError, setProductError] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // QR Row Handlers
  const handleAddQrRow = () => {
    setQrRows((prev) => [...prev, { id: Date.now(), cashbackAmount: "", quantity: 10 }]);
  };
  const handleRemoveQrRow = (id) => {
    setQrRows((prev) => {
      const remaining = prev.filter((row) => row.id !== id);
      return remaining.length ? remaining : [{ id: Date.now(), cashbackAmount: "", quantity: 10 }];
    });
  };
  const handleQrRowChange = (id, field, value) => {
    setQrRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedQrCampaign),
    [campaigns, selectedQrCampaign]
  );

  const campaignPriceHints = useMemo(() => {
    const map = {};
    qrs.forEach((qr) => {
      const campaignId = qr.Campaign?.id || qr.campaignId;
      if (!campaignId) return;
      const price = getGeneratedPrice(qr);
      if (!price) return;
      const createdAt = new Date(qr.createdAt || 0).getTime();
      const existing = map[campaignId];
      if (!existing || createdAt > existing.createdAt) {
        map[campaignId] = { price, createdAt };
      }
    });
    return map;
  }, [qrs]);

  const selectedCampaignCashback = parseNumericValue(selectedCampaign?.cashbackAmount, 0);
  const selectedCampaignBudget = parseNumericValue(selectedCampaign?.totalBudget, 0);
  const selectedCampaignPriceHint = selectedCampaign
    ? campaignPriceHints[selectedCampaign.id]?.price || 0
    : 0;
  const effectiveCampaignCashback =
    selectedCampaignCashback > 0 ? selectedCampaignCashback : selectedCampaignPriceHint;

  const isAuthenticated = Boolean(token);
  const subscriptionStatus = String(subscriptionInfo?.status || "INACTIVE").toLowerCase();
  const subscriptionStatusLabel = subscriptionStatus.toUpperCase();
  const subscriptionBadgeClass =
    {
      active: "bg-emerald-500/10 text-emerald-400",
      paused: "bg-amber-500/10 text-amber-400",
      expired: "bg-rose-500/10 text-rose-400",
      inactive: "bg-rose-500/10 text-rose-400",
    }[subscriptionStatus] || "bg-slate-500/10 text-slate-300";
  const subscriptionEndsAt = formatShortDate(subscriptionInfo?.endDate);
  const subscriptionStartsAt = formatShortDate(subscriptionInfo?.startDate);
  const subscriptionPlanLabel =
    subscriptionTypeLabels[subscriptionInfo?.subscriptionType] || "-";
  const subscriptionHeading =
    subscriptionStatus === "expired"
      ? "Subscription expired"
      : subscriptionStatus === "paused"
        ? "Subscription paused"
        : "Subscription inactive";

  const getQrValue = (hash) => {
    const envBase = import.meta.env.VITE_QR_BASE_URL;
    if (envBase) {
      return `${envBase.replace(/\/$/, "")}/redeem/${hash}`;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}/redeem/${hash}`;
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
    if (normalized === "paid" || normalized === "shipped") {
      return "text-emerald-600 dark:text-emerald-400";
    }
    if (normalized === "expired") return "text-rose-600 dark:text-rose-400";
    if (normalized === "assigned") return "text-amber-600 dark:text-amber-400";
    if (normalized === "generated" || normalized === "active") {
      return "text-primary-strong dark:text-primary";
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

  const handleDownloadGroupPdf = (group) => {
    if (!group || !group.qrs || group.qrs.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const qrSize = 40;
    const margin = 14;
    const itemsPerRow = 4;
    const rowsPerPage = 6;
    const rowSpacing = qrSize + 28;
    const spacing = (pageWidth - margin * 2 - qrSize * itemsPerRow) / Math.max(itemsPerRow - 1, 1);
    const displayPrice = parseNumericValue(group.price, group.qrs[0]?.cashbackAmount ?? 0);
    const priceLabel = formatAmount(displayPrice);
    const campaignTitle = group.campaignTitle || "Campaign";

    const drawHeader = () => {
      doc.setFontSize(16);
      doc.text(`QR Batch - INR ${priceLabel}`, margin, 18);
      doc.setFontSize(10);
      doc.text(`Campaign: ${campaignTitle}`, margin, 26);
    };
    drawHeader();

    const itemsPerPage = itemsPerRow * rowsPerPage;

    group.qrs.forEach((qr, index) => {
      const localIndex = index % itemsPerPage;
      if (index > 0 && localIndex === 0) {
        doc.addPage();
        drawHeader();
      }

      const col = localIndex % itemsPerRow;
      const row = Math.floor(localIndex / itemsPerRow);
      const xPos = margin + col * (qrSize + spacing);
      const yPos = 36 + row * rowSpacing;

      const canvas = document.getElementById(getQrCanvasId(qr.uniqueHash));
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", xPos, yPos, qrSize, qrSize);

      const perPrice = getGeneratedPrice(qr) || displayPrice;
      doc.setFontSize(8);
      doc.text(qr.uniqueHash.slice(0, 8), xPos, yPos + qrSize + 6);
      doc.text(`INR ${formatAmount(perPrice)}`, xPos, yPos + qrSize + 12);
    });

    doc.save(`qrs-${priceLabel}-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
  };

  const handleDeleteQrBatch = async ({ campaignId, priceKey, price, count }) => {
    if (!token) return;
    const priceLabel = formatAmount(price);
    const confirmMessage = `Delete ${count} QR${count !== 1 ? "s" : ""} at INR ${priceLabel}? Only unused QRs will be removed.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const batchKey = `${campaignId}-${priceKey ?? price}`;
    setDeletingBatchKey(batchKey);
    setQrError("");

    try {
      const result = await deleteVendorQrBatch(token, campaignId, priceKey ?? price);
      const deleted = result.deleted ?? result.count ?? 0;
      const skipped = result.skipped ?? 0;
      if (skipped > 0) {
        setStatusWithTimeout(`Deleted ${deleted} QRs. Skipped ${skipped} redeemed/blocked.`);
      } else {
        setStatusWithTimeout(`Deleted ${deleted} QRs from batch.`);
      }
      await loadQrs();
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      setQrError(err.message || "Failed to delete QR batch.");
      setTimeout(() => setQrError(""), 3000);
    } finally {
      setDeletingBatchKey(null);
    }
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
    setLastBatchSummary(null);
    setDeletingBatchKey(null);
    lastAutoFilledCashbackRef.current = null;
    setSubscriptionBlocked("");
    setSubscriptionInfo(null);
    setSelectedActiveCampaign(null);
    setQrs([]);
    setQrTotal(0);
    setQrPage(1);
    setQrStatusCounts({});
    setQrHasMore(false);
    setOrders([]);
    setOrdersTotal(0);
    setOrdersPage(1);
    setOrderStatusCounts({});
    setOrdersHasMore(false);
  };

  const handleVendorAccessError = (err) => {
    if (err?.status === 401) {
      clearSession("Session expired.");
      return true;
    }
    if (err?.status === 403) {
      setSubscriptionBlocked(err.message || "Subscription access is inactive.");
      return true;
    }
    return false;
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
    if (!authToken) return false;
    setIsLoadingWallet(true);
    setWalletError("");
    try {
      const data = await getVendorWallet(authToken);
      setWallet(data);
      return true;
    } catch (err) {
      if (handleVendorAccessError(err)) return false;
      if (err.status === 404) {
        setWallet(null);
      } else {
        setWalletError(err.message || "Unable to load wallet.");
      }
      return true;
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const loadQrs = async (authToken = token, { page = 1, append = false } = {}) => {
    if (!authToken) return;
    setIsLoadingQrs(true);
    setQrError("");
    const limit = 120;
    try {
      const data = await getVendorQrs(authToken, { page, limit });
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];
      const total = Number.isFinite(data?.total) ? data.total : items.length;
      const statusCounts = data?.statusCounts || {};

      setQrs((prev) => {
        const updated = append ? [...prev, ...items] : items;
        setQrHasMore(updated.length < total);
        return updated;
      });
      setQrTotal(total);
      setQrPage(page);
      setQrStatusCounts(statusCounts);
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      if (err.status === 404) {
        setQrs([]);
        setQrTotal(0);
        setQrHasMore(false);
      } else {
        setQrError(err.message || "Unable to load QR inventory.");
      }
    } finally {
      setIsLoadingQrs(false);
    }
  };

  const loadOrders = async (authToken = token, { page = 1, append = false } = {}) => {
    if (!authToken) return;
    setIsLoadingOrders(true);
    setOrdersError("");
    const limit = 20;
    try {
      const data = await getVendorOrders(authToken, { page, limit });
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];
      const total = Number.isFinite(data?.total) ? data.total : items.length;
      const statusCounts = data?.statusCounts || {};

      setOrders((prev) => {
        const updated = append ? [...prev, ...items] : items;
        setOrdersHasMore(updated.length < total);
        return updated;
      });
      setOrdersTotal(total);
      setOrdersPage(page);
      setOrderStatusCounts(statusCounts);
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      if (err.status === 404) {
        setOrders([]);
        setOrdersTotal(0);
        setOrdersHasMore(false);
      } else {
        setOrdersError(err.message || "Unable to load orders.");
      }
    } finally {
      setIsLoadingOrders(false);
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
      if (handleVendorAccessError(err)) return;
      if (err.status === 404) {
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
        id: data.id || "",
        name: data.name || "",
        logoUrl: data.logoUrl || "",
        website: data.website || "",
      });
      setSubscriptionInfo(data.subscription || data.Subscription || null);
      setSubscriptionBlocked("");
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      if (err.status === 404) {
        setBrandProfile({
          id: "",
          name: "",
          logoUrl: "",
          website: "",
        });
        setSubscriptionInfo(null);
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
      if (handleVendorAccessError(err)) return;
      if (err.status === 404) {
        setCampaigns([]);
      } else {
        setCampaignError(err.message || "Unable to load campaigns.");
      }
    }
  };

  const loadProducts = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingProducts(true);
    setProductError("");
    try {
      const data = await getVendorProducts(authToken);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      if (err.status === 404) {
        setProducts([]);
      } else {
        setProductError(err.message || "Unable to load products.");
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!token || subscriptionBlocked) return;
    const initializeVendorData = async () => {
      await loadVendor(token);
      const canContinue = await loadWallet(token);
      if (!canContinue) return;
      await Promise.all([
        loadQrs(token),
        loadOrders(token),
        loadCompanyProfile(token),
        loadBrandProfile(token),
        loadCampaigns(token),
        loadProducts(token),
      ]);
    };
    initializeVendorData();
  }, [token, subscriptionBlocked]);

  useEffect(() => {
    if (!selectedCampaign) {
      return;
    }

    const cashbackValue = effectiveCampaignCashback > 0 ? String(effectiveCampaignCashback) : "";

    setQrRows((prev) => {
      if (!prev.length) return prev;
      const [first, ...rest] = prev;
      const firstValueRaw = String(first.cashbackAmount || "").trim();
      const firstValue = parseNumericValue(first.cashbackAmount, 0);
      const autoFillValue = lastAutoFilledCashbackRef.current;
      const shouldReplace =
        !firstValueRaw || (autoFillValue !== null && firstValue === autoFillValue);

      if (!shouldReplace || !cashbackValue) {
        return prev;
      }

      lastAutoFilledCashbackRef.current = parseNumericValue(cashbackValue, 0);
      return [{ ...first, cashbackAmount: cashbackValue }, ...rest];
    });
  }, [selectedCampaign, effectiveCampaignCashback]);

  // Scroll to top on route/tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const handleSignIn = async () => {
    const identifier = email.trim();
    if (!identifier || !password) {
      setAuthError("Enter email/username and password to continue.");
      return;
    }
    setAuthError("");
    setAuthStatus("");
    setSubscriptionBlocked("");
    setIsSigningIn(true);
    try {
      const normalizedIdentifier = identifier.toLowerCase();
      const isEmail = normalizedIdentifier.includes("@");
      const data = await loginWithEmail(
        isEmail ? normalizedIdentifier : undefined,
        password,
        isEmail ? undefined : normalizedIdentifier
      );
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
      if (err?.status === 403) {
        const message = err.message || "Subscription is not active.";
        setSubscriptionBlocked(message);
        setAuthError(message);
      } else {
        setAuthError(err.message || "Sign in failed.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = () => {
    clearSession("Signed out.");
    setWallet(null);
    setQrs([]);
    setOrders([]);
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
      id: "",
      name: "",
      logoUrl: "",
      website: "",
    });
    setCampaigns([]);
    setCampaignId("");
    setLastBatchSummary(null);
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
      if (handleVendorAccessError(err)) return;
      setWalletError(err.message || "Recharge failed.");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleOrderQrs = async () => {
    if (!selectedQrCampaign) {
      setQrOrderError("Please select a campaign first.");
      return;
    }
    if (!selectedQrProduct) {
      setQrOrderError("Please select a product first.");
      return;
    }

    const campaign = campaigns.find((c) => c.id === selectedQrCampaign);
    if (!campaign || campaign.status !== "active") {
      setQrOrderError("Selected campaign is not active.");
      return;
    }

    // Get cashback and quantity from campaignRows (allocations)
    const validRows = campaignRows.filter((row) => Number(row.cashbackAmount) > 0 && Number(row.quantity) > 0);

    // If no valid allocations in campaign, use campaign's default cashback
    const rowsToUse = validRows.length > 0 ? validRows : [{
      cashbackAmount: campaign.cashbackAmount || 0,
      quantity: 1
    }];

    if (rowsToUse.length === 0 || (rowsToUse[0].cashbackAmount <= 0)) {
      setQrOrderError("Please set cashback amount in campaign allocations.");
      return;
    }

    setIsOrdering(true);
    setQrOrderError("");
    setQrOrderStatus("");

    const batchTiers = rowsToUse
      .map((row) => {
        const price = parseNumericValue(row.cashbackAmount, 0);
        const quantityValue = Math.max(0, Math.floor(Number(row.quantity) || 0));
        if (price <= 0 || quantityValue <= 0) return null;
        return {
          price,
          quantity: quantityValue,
          cost: price * quantityValue,
        };
      })
      .filter(Boolean);

    const uniquePrices = Array.from(new Set(batchTiers.map((tier) => tier.price)));
    const desiredCashback = uniquePrices.length === 1 ? uniquePrices[0] : null;
    const desiredBudget = batchTiers.reduce((sum, tier) => sum + tier.cost, 0);

    // Skip the campaign update confirmation - just proceed with QR generation

    let successes = 0;
    let failures = 0;
    const newHashes = [];
    const newOrderIds = [];
    let totalPrintCost = 0;

    try {
      for (const row of rowsToUse) {
        try {
          // Use the selected campaign for all rows, pass per-row cashbackAmount
          const result = await orderVendorQrs(token, selectedQrCampaign, Number(row.quantity), Number(row.cashbackAmount));
          successes += result.count || 0;
          if (result?.order?.id) {
            newOrderIds.push(result.order.id);
            const printAmount = Number(result.order.totalAmount);
            if (Number.isFinite(printAmount)) {
              totalPrintCost += printAmount;
            }
          }
          if (Array.isArray(result.qrs)) {
            newHashes.push(...result.qrs.map((item) => item.uniqueHash));
          }
        } catch (err) {
          if (handleVendorAccessError(err)) {
            throw err;
          }
          const errorMsg = err.message || `Failed to generate QRs for cashback ₹${row.cashbackAmount}`;
          console.error(errorMsg, err);
          // Show the actual error to user
          if (err.message?.includes('Insufficient') || err.message?.includes('balance')) {
            setQrOrderError(`Insufficient wallet balance. Please top up your wallet first.`);
            setIsOrdering(false);
            return;
          }
          failures++;
        }
      }

      if (failures > 0 && successes === 0) {
        setQrOrderStatus("");
        setQrOrderError("QR generation failed. Please check your allocations and wallet balance.");
      } else {
        setQrOrderStatus(
          `Generated ${successes} QRs successfully.` + (failures > 0 ? ` (${failures} batches failed)` : "")
        );
      }

      if (successes > 0 && batchTiers.length > 0) {
        setLastBatchSummary({
          id: newOrderIds[0] || Date.now(),
          campaignTitle: campaign?.title || "Campaign",
          timestamp: new Date().toISOString(),
          tiers: batchTiers,
          totalQrs: successes,
          totalCost: batchTiers.reduce((sum, tier) => sum + tier.cost, 0),
          totalPrintCost,
          orderIds: newOrderIds,
          hashes: newHashes.slice(0, 50),
        });
      }
      if (newHashes.length > 0) {
        setLastOrderHashes(newHashes.slice(0, 10));
        await loadWallet();
        await loadQrs();
        await loadOrders();
      }
      if (failures === 0) {
        setQrRows([{ id: Date.now(), cashbackAmount: "", quantity: 10 }]);
      }
    } catch (err) {
      if (handleVendorAccessError(err)) return;
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
      if (handleVendorAccessError(err)) return;
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

  const handleRegistrationSave = async () => {
    if (!companyProfile.businessName.trim()) {
      setRegistrationError("Company name is required.");
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
      setRegistrationStatus("Company profile updated.");
      await loadCompanyProfile();
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      setRegistrationError(err.message || "Unable to save profile.");
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
    // Calculate total allocations from rows
    let calculatedTotalBudget = 0;
    let firstCashbackValue = 0;

    if (campaignRows.length > 0) {
      firstCashbackValue = parseOptionalNumber(campaignRows[0].cashbackAmount) || 0;
    }

    for (const row of campaignRows) {
      // Skip empty rows
      if (!row.cashbackAmount && !row.quantity && !row.totalBudget) continue;

      const cb = parseOptionalNumber(row.cashbackAmount);
      const qtyValue = parseOptionalNumber(row.quantity);
      const derivedTotal = getAllocationRowTotal(row);

      if (cb === null || cb < 0) {
        setCampaignError("Invalid cashback amount in allocations.");
        return;
      }
      if (qtyValue === null || qtyValue < 0) {
        setCampaignError("Invalid quantity in allocations.");
        return;
      }
      if (derivedTotal === null || derivedTotal < 0) {
        setCampaignError("Invalid total budget/cost in allocations.");
        return;
      }
      calculatedTotalBudget += derivedTotal;
    }

    const cashbackValue = firstCashbackValue;
    const budgetValue = calculatedTotalBudget > 0 ? calculatedTotalBudget : null;
    const now = new Date();
    const startDate = new Date(now);
    let endDate = null;
    if (subscriptionInfo?.endDate) {
      const parsedEnd = new Date(subscriptionInfo.endDate);
      if (!Number.isNaN(parsedEnd.getTime())) {
        endDate = parsedEnd;
      }
    }
    if (!endDate || endDate <= startDate) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
    }
    const startDateValue = startDate.toISOString().slice(0, 10);
    const endDateValue = endDate.toISOString().slice(0, 10);
    setCampaignError("");
    setCampaignStatus("");
    setIsSavingCampaign(true);
    try {
      let derivedBrandId = null;

      // Check if we can get brandId from selected product
      if (campaignForm.productId) {
        const product = products.find(p => p.id === campaignForm.productId);
        if (product && product.brandId) {
          derivedBrandId = product.brandId;
        }
      }

      let effectiveBrandId = derivedBrandId || brandProfile?.id || null;

      if (!effectiveBrandId) {
        try {
          const brand = await getVendorBrand(token);
          effectiveBrandId = brand?.id || null;
        } catch (brandErr) {
          if (handleVendorAccessError(brandErr)) return;
          setCampaignError("No brand is assigned yet. Please contact the admin or select a product.");
          setIsSavingCampaign(false);
          return;
        }
      }

      if (!effectiveBrandId) {
        setCampaignError("Unable to determine brand for this campaign. Please select a product.");
        setIsSavingCampaign(false);
        return;
      }

      const result = await createVendorCampaign(token, {
        brandId: effectiveBrandId,
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim() || undefined,
        startDate: startDateValue,
        endDate: endDateValue,
        totalBudget: budgetValue,
        subtotal: budgetValue,
        allocations: campaignRows.map(row => {
          const cashbackAmount = parseOptionalNumber(row.cashbackAmount) || 0;
          const quantity = parseInt(row.quantity, 10) || 0;
          const allocationTotal =
            getAllocationRowTotal({ cashbackAmount, quantity }) ?? 0;
          return {
            productId: campaignForm.productId || null,
            cashbackAmount,
            quantity,
            totalBudget: allocationTotal
          };
        })
      });
      setCampaignStatusWithTimeout("Campaign created.");
      setCampaignForm({
        title: "",
        description: "",
        cashbackAmount: "",
        totalBudget: "",
        productId: "",
      });
      setCampaignRows([{ id: Date.now(), cashbackAmount: "", quantity: "", totalBudget: "" }]);
      if (result?.campaign) {
        setCampaigns((prev) => {
          const filtered = prev.filter((campaign) => campaign.id !== result.campaign.id);
          return [result.campaign, ...filtered];
        });
      }
      // result from createVendorCampaign structure is { message, campaign }
      // But we can just reload campaigns.
      await loadCampaigns();
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      console.error("Campaign creation error:", err);
      setCampaignError(err.error || err.message || "Campaign creation failed.");
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handlePayCampaign = async (campaign) => {
    if (!campaign) return;
    setIsPayingCampaign(true);
    setCampaignError("");

    try {
      const totalQty = (campaign.allocations || []).reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0);
      const printCost = totalQty * 1;
      const baseBudget = parseNumericValue(
        campaign.subtotal,
        parseNumericValue(campaign.totalBudget, 0)
      );
      const totalCost = baseBudget + printCost;

      if (!wallet || wallet.balance < totalCost) {
        throw new Error(`Insufficient wallet balance. Required: ₹${totalCost.toFixed(2)}`);
      }

      await payVendorCampaign(token, campaign.id);

      setCampaignStatusWithTimeout("Campaign paid and activated!");
      setSelectedPendingCampaign(null);
      await loadWallet();
      await loadCampaigns(); // To move it to active list
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      console.error("Payment error:", err);
      // Show error in the main dashboard or a toast? 
      // For now, using the main error state which might be visible behind modal or we can alert.
      // Actually, let's set it so it renders inside modal via a local state if we had one, but global is okay for now.
      alert(err.message || "Payment failed");
    } finally {
      setIsPayingCampaign(false);
    }
  };

  const handleProductChange = (field) => (event) => {
    setProductForm((prev) => ({ ...prev, [field]: event.target.value }));
    setProductStatus("");
    setProductError("");
  };

  const setProductStatusWithTimeout = (message) => {
    setProductStatus(message);
    setTimeout(() => setProductStatus(""), 2000);
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      setProductError("Product name is required.");
      return;
    }

    setProductError("");
    setProductStatus("");
    setIsSavingProduct(true);

    try {
      // Get the vendor's first brand
      let effectiveBrandId = brandProfile?.id || null;
      if (!effectiveBrandId) {
        try {
          const brand = await getVendorBrand(token);
          effectiveBrandId = brand?.id || null;
        } catch (brandErr) {
          if (handleVendorAccessError(brandErr)) return;
          setProductError("No brand is assigned yet. Please contact the admin.");
          setIsSavingProduct(false);
          return;
        }
      }

      if (!effectiveBrandId) {
        setProductError("No brand is assigned yet. Please contact the admin.");
        setIsSavingProduct(false);
        return;
      }

      await addVendorProduct(token, {
        brandId: effectiveBrandId,
        name: productForm.name.trim(),
        variant: productForm.variant.trim() || null,
        category: productForm.category.trim() || null,
        description: productForm.description.trim() || null,
        imageUrl: productForm.imageUrl.trim() || null,
      });
      setProductStatusWithTimeout("Product added successfully.");
      setProductForm({
        name: "",
        variant: "",
        category: "",
        description: "",
        imageUrl: "",
      });
      await loadProducts();
    } catch (err) {
      if (handleVendorAccessError(err)) return;
      setProductError(err.message || "Failed to add product.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const qrStats = useMemo(() => {
    const statusCounts = qrStatusCounts || {};
    const activeFromCounts =
      (statusCounts.generated || 0) + (statusCounts.assigned || 0) + (statusCounts.active || 0);
    const redeemedFromCounts = (statusCounts.redeemed || 0) + (statusCounts.claimed || 0);
    const totalFromCounts = Number.isFinite(qrTotal) && qrTotal > 0 ? qrTotal : 0;

    if (Object.keys(statusCounts).length || totalFromCounts > 0) {
      return {
        total: totalFromCounts || qrs.length,
        redeemed: redeemedFromCounts,
        active: activeFromCounts
      };
    }

    const total = qrs.length;
    const redeemed = qrs.filter((qr) => qr.status === "redeemed").length;
    const activeStatuses = new Set(["generated", "assigned", "active"]);
    const active = qrs.filter((qr) => activeStatuses.has(qr.status)).length;
    return { total, redeemed, active };
  }, [qrStatusCounts, qrTotal, qrs]);
  const qrTotalLabel = qrTotal || qrs.length;
  const qrCoverageLabel =
    qrTotal > qrs.length ? `Showing latest ${qrs.length} of ${qrTotal}` : "";
  const pendingCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status === "pending"),
    [campaigns]
  );
  const activeCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status === "active"),
    [campaigns]
  );
  const showQrGenerator = false;
  const showQrOrdersSection = false;
  const showOrderTracking = false;

  const overviewCampaignOptions = useMemo(() => {
    const options = [{ id: "all", label: "All campaigns" }];
    const sortedCampaigns = [...campaigns].sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""))
    );
    sortedCampaigns.forEach((campaign) => {
      options.push({
        id: campaign.id,
        label: campaign.title || "Untitled campaign",
      });
    });
    const hasUnassigned = qrs.some((qr) => !(qr.Campaign?.id || qr.campaignId));
    if (hasUnassigned) {
      options.push({ id: "unassigned", label: "Unassigned QRs" });
    }
    return options;
  }, [campaigns, qrs]);

  const overviewCampaignLabel = useMemo(() => {
    const match = overviewCampaignOptions.find((option) => option.id === overviewCampaignId);
    return match?.label || "Campaign";
  }, [overviewCampaignId, overviewCampaignOptions]);

  useEffect(() => {
    const isValidSelection = overviewCampaignOptions.some(
      (option) => option.id === overviewCampaignId
    );
    if (!isValidSelection) {
      setOverviewCampaignId("all");
    }
  }, [overviewCampaignId, overviewCampaignOptions]);

  const overviewFilteredQrs = useMemo(() => {
    if (overviewCampaignId === "all") return qrs;
    if (overviewCampaignId === "unassigned") {
      return qrs.filter((qr) => !(qr.Campaign?.id || qr.campaignId));
    }
    return qrs.filter(
      (qr) => (qr.Campaign?.id || qr.campaignId) === overviewCampaignId
    );
  }, [overviewCampaignId, qrs]);

  const overviewQrStatusCounts = useMemo(() => {
    const counts = {
      total: 0,
      generated: 0,
      assigned: 0,
      active: 0,
      redeemed: 0,
      expired: 0,
      blocked: 0,
      unknown: 0,
    };

    overviewFilteredQrs.forEach((qr) => {
      counts.total += 1;
      const status = String(qr.status || "unknown").toLowerCase();
      if (status === "claimed") {
        counts.redeemed += 1;
        return;
      }
      if (counts[status] !== undefined) {
        counts[status] += 1;
      } else {
        counts.unknown += 1;
      }
    });

    return counts;
  }, [overviewFilteredQrs]);
  const isOverviewAll = overviewCampaignId === "all";
  const isOverviewUnassigned = overviewCampaignId === "unassigned";
  const overviewSelectedCampaignCount = isOverviewAll
    ? campaigns.length
    : isOverviewUnassigned
      ? 0
      : 1;
  const overviewSelectedQrTotal = isOverviewAll ? qrStats.total : overviewQrStatusCounts.total;
  const overviewSelectedQrRedeemed = isOverviewAll ? qrStats.redeemed : overviewQrStatusCounts.redeemed;

  const overviewRedemptionSeries = useMemo(() => {
    const days = 7;
    const today = new Date();
    const buckets = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = format(date, "yyyy-MM-dd");
      buckets.push({ key, name: format(date, "MMM d"), redemptions: 0 });
    }

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    overviewFilteredQrs.forEach((qr) => {
      const status = String(qr.status || "").toLowerCase();
      if (status !== "redeemed" && status !== "claimed") return;
      const rawDate = qr.updatedAt || qr.createdAt;
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;
      const key = format(date, "yyyy-MM-dd");
      const bucket = bucketMap.get(key);
      if (!bucket) return;
      bucket.redemptions += 1;
    });

    return buckets.map(({ key, ...rest }) => rest);
  }, [overviewFilteredQrs]);

  const campaignPerformanceSeries = useMemo(() => {
    if (!overviewFilteredQrs.length) return [];
    const redeemedStatuses = new Set(["redeemed", "claimed"]);

    if (!isOverviewAll) {
      const redeemedCount = overviewFilteredQrs.filter((qr) =>
        redeemedStatuses.has(String(qr.status || "").toLowerCase())
      ).length;
      return [
        {
          name: overviewCampaignLabel,
          sent: overviewFilteredQrs.length,
          redeemed: redeemedCount,
        },
      ];
    }

    const nameMap = new Map(
      campaigns.map((campaign) => [campaign.id, campaign.title || "Untitled campaign"])
    );
    const summaryMap = new Map();

    overviewFilteredQrs.forEach((qr) => {
      const campaignId = qr.Campaign?.id || qr.campaignId || "unassigned";
      const campaignTitle =
        qr.Campaign?.title || nameMap.get(campaignId) || "Unassigned";
      if (!summaryMap.has(campaignId)) {
        summaryMap.set(campaignId, { name: campaignTitle, sent: 0, redeemed: 0 });
      }
      const summary = summaryMap.get(campaignId);
      summary.sent += 1;
      if (redeemedStatuses.has(String(qr.status || "").toLowerCase())) {
        summary.redeemed += 1;
      }
    });

    return Array.from(summaryMap.values())
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 6);
  }, [overviewFilteredQrs, isOverviewAll, overviewCampaignLabel, campaigns]);

  const recentQrs = useMemo(() => {
    return [...qrs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 12);
  }, [qrs]);

  const qrGallery = useMemo(() => {
    return [...qrs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [qrs]);

  const inventoryQrs = useMemo(() => {
    return showAllInventory ? qrGallery : recentQrs;
  }, [showAllInventory, qrGallery, recentQrs]);

  // Group QRs by Campaign first, then by price within each campaign
  const qrsGroupedByCampaign = useMemo(() => {
    const campaignMap = {};

    qrs.forEach((qr) => {
      const campaignId = qr.Campaign?.id || 'unassigned';
      const campaignTitle = qr.Campaign?.title || 'Unassigned';
      const price = getGeneratedPrice(qr);
      const priceKey = price.toFixed(2);

      if (!campaignMap[campaignId]) {
        campaignMap[campaignId] = {
          id: campaignId,
          title: campaignTitle,
          endDate: qr.Campaign?.endDate,
          status: qr.Campaign?.status,
          priceGroups: {},
          stats: { total: 0, active: 0, redeemed: 0 }
        };
      }

      if (!campaignMap[campaignId].priceGroups[priceKey]) {
        campaignMap[campaignId].priceGroups[priceKey] = {
          price,
          priceKey,
          qrs: [],
          activeCount: 0,
          redeemedCount: 0
        };
      }

      const group = campaignMap[campaignId].priceGroups[priceKey];
      group.qrs.push(qr);
      campaignMap[campaignId].stats.total++;

      if (qr.status === 'redeemed') {
        group.redeemedCount++;
        campaignMap[campaignId].stats.redeemed++;
      } else {
        group.activeCount++;
        campaignMap[campaignId].stats.active++;
      }
    });

    return Object.values(campaignMap)
      .map((campaign) => ({
        ...campaign,
        priceGroups: Object.values(campaign.priceGroups).sort((a, b) => b.price - a.price)
      }))
      .sort((a, b) => {
        if (a.id === 'unassigned') return 1;
        if (b.id === 'unassigned') return -1;
        return a.title.localeCompare(b.title);
      });
  }, [qrs]);
  const campaignQrMap = useMemo(() => {
    const map = new Map();
    qrsGroupedByCampaign.forEach((campaign) => {
      if (campaign.id !== "unassigned") {
        map.set(campaign.id, campaign);
      }
    });
    return map;
  }, [qrsGroupedByCampaign]);
  const activeCampaignDetails = useMemo(() => {
    if (!selectedActiveCampaign) return null;
    const campaign = selectedActiveCampaign;
    const allocationGroups = buildAllocationGroups(campaign.allocations);
    const totalQty = allocationGroups.reduce((sum, group) => sum + group.quantity, 0);
    const fallbackBudget = allocationGroups.reduce((sum, group) => sum + group.totalBudget, 0);
    const totalBudget = parseNumericValue(
      campaign.subtotal,
      parseNumericValue(campaign.totalBudget, fallbackBudget)
    );
    const printCost = totalQty * 1;
    const stats = campaignQrMap.get(campaign.id);
    const priceGroups = stats?.priceGroups || [];
    const productId =
      campaign.productId ||
      (Array.isArray(campaign.allocations)
        ? campaign.allocations.find((alloc) => alloc.productId)?.productId
        : null);
    const product = productId ? products.find((item) => item.id === productId) : null;
    const breakdownRows = priceGroups.length
      ? priceGroups.map((group) => ({
        cashback: group.price,
        quantity: group.qrs.length,
        active: group.activeCount,
        redeemed: group.redeemedCount,
      }))
      : allocationGroups.map((group) => ({
        cashback: group.price,
        quantity: group.quantity,
        active: 0,
        redeemed: 0,
      }));

    return {
      campaign,
      allocationGroups,
      totalQty,
      totalBudget,
      printCost,
      stats,
      product,
      breakdownRows,
    };
  }, [selectedActiveCampaign, campaignQrMap, products]);
  const activeCampaign = activeCampaignDetails?.campaign;

  const primaryQrRow = qrRows[0];
  const primaryQrCashback = parseNumericValue(primaryQrRow?.cashbackAmount, 0);
  const primaryQrQuantity = Math.max(0, Math.floor(Number(primaryQrRow?.quantity) || 0));
  const primaryQrCost = primaryQrCashback * primaryQrQuantity;
  const canGenerateQrs =
    Boolean(selectedQrCampaign) && primaryQrCashback > 0 && primaryQrQuantity > 0;

  const walletBalance = wallet?.balance;
  const lockedBalance = wallet?.lockedBalance;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 p-6">
      {subscriptionBlocked ? (
        <div className="mx-auto max-w-md bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-xl space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <ShieldCheck size={18} className="text-rose-400" />
            {subscriptionHeading}
          </div>
          <div className="text-xs text-gray-400">{subscriptionBlocked}</div>
          <div className="flex flex-wrap justify-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${subscriptionBadgeClass}`}>
              {subscriptionStatusLabel}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-gray-400">
              Plan: {subscriptionPlanLabel}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-gray-400">
              Ends: {subscriptionEndsAt}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl bg-white/10 text-white text-sm font-semibold py-2 hover:bg-white/20 transition-colors"
          >
            Back to login
          </button>
        </div>
      ) : (
        <>
          {!isAuthenticated && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <ShieldCheck size={16} className="text-primary-strong" />
                Vendor access
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="brand username or email"
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
                className="w-full rounded-xl bg-primary text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
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
              {/* Main Dashboard Layout */}
              <div className="mx-auto w-full max-w-[1920px] px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Sidebar Navigation */}
                  <aside className="lg:w-64 flex-shrink-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-xl h-fit sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-none">
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                          <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                            {(vendorInfo?.name || "V")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {vendorInfo?.name || "Vendor"}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {vendorInfo?.email || ""}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Quick View */}
                      {/* Stats Quick View */}
                      <div className="grid grid-cols-2 gap-2">
                        <StarBorder as="div" className="w-full" color="#81cc2a" speed="5s" innerClassName="bg-white dark:bg-[#000] shadow-sm dark:shadow-none">
                          <div className="flex flex-col items-center justify-center w-full">
                            <div className="text-[10px] text-gray-500 mb-0.5">Wallet</div>
                            <div
                              className="text-sm font-bold text-[#81cc2a] truncate max-w-full"
                              title={`₹${formatAmount(walletBalance)}`}
                            >
                              ₹{formatCompactAmount(walletBalance)}
                            </div>
                          </div>
                        </StarBorder>
                        <StarBorder as="div" className="w-full" color="#81cc2a" speed="5s" innerClassName="bg-white dark:bg-[#000] shadow-sm dark:shadow-none">
                          <div className="flex flex-col items-center justify-center w-full">
                            <div className="text-[10px] text-gray-500 mb-0.5">Active QRs</div>
                            <div className="text-sm font-bold text-[#81cc2a]">₹{qrStats.active}</div>
                          </div>
                        </StarBorder>
                      </div>

                      {/* Navigation */}
                      {/* Navigation */}
                      <nav className="space-y-2">
                        {[
                          { id: 'overview', label: 'Overview', icon: Store },
                          { id: 'products', label: 'Products', icon: Package },
                          { id: 'campaigns', label: 'Campaigns & QR', icon: BadgeCheck },
                          { id: 'wallet', label: 'Wallet', icon: Wallet },
                          { id: 'brand', label: 'Profile Settings', icon: ShieldCheck },
                          { id: 'scan', label: 'Scan & Redeem', icon: ScanLine },
                        ].map((item) => {
                          const isActive = activeTab === item.id;
                          if (isActive) {
                            return (
                              <StarBorder
                                key={item.id}
                                as="button"
                                onClick={() => navigate(`/vendor/${item.id}`)}
                                color="#81cc2a" // Lime Green
                                speed="4s"
                                className="w-full cursor-pointer"
                                innerClassName="bg-white dark:bg-[#000] pointer-events-none text-gray-900 dark:text-white"
                              >
                                <item.icon size={18} className="text-[#81cc2a]" />
                                <span className="font-semibold text-gray-900 dark:text-white">{item.label}</span>
                              </StarBorder>
                            );
                          }
                          return (
                            <button
                              key={item.id}
                              onClick={() => navigate(`/vendor/${item.id}`)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#252525] dark:hover:text-gray-200 transition-all font-medium"
                            >
                              <item.icon size={18} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </nav>

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-900/20 text-red-400 text-sm font-medium border border-red-900/30"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </aside>

                  {/* Main Content */}
                  <main className="flex-1 min-w-0 space-y-4 overflow-x-hidden">
                    {/* Top Greeting Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning, {vendorInfo?.name || "Vendor"}!</h1>
                        <p className="text-sm text-gray-400 mt-1">Here's what's happening with your store today</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="search"
                            placeholder="Search..."
                            className="w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-4 py-2 pl-10 text-sm text-gray-900 dark:text-white placeholder-gray-500"
                          />
                          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <ModeToggle />
                      </div>
                    </div>

                    {/* Stats Row */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-400 pr-6">
                          <span className="text-gray-500">Campaign</span>
                          <select
                            value={overviewCampaignId}
                            onChange={(event) => setOverviewCampaignId(event.target.value)}
                            className="mr-2 min-w-[180px] max-w-[240px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                          >
                            {overviewCampaignOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          {/* Wallet Balance Card */}
                          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-2">
                              <div className="overflow-hidden">
                                <div className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate" title={`₹${formatAmount(walletBalance)}`}>
                                  ₹{formatCompactAmount(walletBalance)}
                                </div>
                                <div className="text-xs text-gray-500">Wallet Balance</div>
                              </div>
                              <div className="h-10 w-10 xl:h-12 xl:w-12 rounded-lg bg-cyan-600/10 flex items-center justify-center flex-shrink-0 ml-2">
                                <Wallet className="h-5 w-5 xl:h-6 xl:w-6 text-cyan-400" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-emerald-400">+5.9%</span>
                              <span className="text-gray-500">vs last month</span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-2">
                              <div className="overflow-hidden">
                                <div className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                  {overviewSelectedCampaignCount}
                                </div>
                                <div className="text-xs text-gray-500">Total Campaigns</div>
                              </div>
                              <div className="h-10 w-10 xl:h-12 xl:w-12 rounded-lg bg-purple-600/10 flex items-center justify-center flex-shrink-0 ml-2">
                                <BadgeCheck className="h-5 w-5 xl:h-6 xl:w-6 text-purple-400" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>Selected: {overviewSelectedCampaignCount}</span>
                              <span className="text-gray-400">•</span>
                              <span>All: {campaigns.length}</span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-2">
                              <div className="overflow-hidden">
                                <div className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                  {overviewSelectedQrTotal}
                                </div>
                                <div className="text-xs text-gray-500">Total QR Codes</div>
                              </div>
                              <div className="h-10 w-10 xl:h-12 xl:w-12 rounded-lg bg-emerald-600/10 flex items-center justify-center flex-shrink-0 ml-2">
                                <QrCode className="h-5 w-5 xl:h-6 xl:w-6 text-emerald-400" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>Selected: {overviewSelectedQrTotal}</span>
                              <span className="text-gray-400">•</span>
                              <span>All: {qrStats.total}</span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-2">
                              <div className="overflow-hidden">
                                <div className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                  {overviewSelectedQrRedeemed}
                                </div>
                                <div className="text-xs text-gray-500">QRs Redeemed</div>
                              </div>
                              <div className="h-10 w-10 xl:h-12 xl:w-12 rounded-lg bg-pink-600/10 flex items-center justify-center flex-shrink-0 ml-2">
                                <Store className="h-5 w-5 xl:h-6 xl:w-6 text-pink-400" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>Selected: {overviewSelectedQrRedeemed}</span>
                              <span className="text-gray-400">•</span>
                              <span>All: {qrStats.redeemed}</span>
                            </div>
                          </div>
                        </div>

                        <VendorAnalytics
                          redemptionSeries={overviewRedemptionSeries}
                          campaignSeries={campaignPerformanceSeries}
                          selectionLabel={overviewCampaignLabel}
                        />

                        <div id="overview" className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm dark:shadow-none">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                                <Store size={16} className="text-blue-400" />
                              </div>
                              <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Redemptions</h3>
                            </div>
                            <button
                              onClick={() => navigate('/vendor/scan')}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                            >
                              Scan New
                            </button>
                          </div>

                          {qrs.filter(q => q.status === 'redeemed' || q.status === 'claimed').length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              No redemptions yet. Share your QR codes to get started!
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm text-gray-400">
                                <thead className="text-xs uppercase bg-gray-100 dark:bg-[#252525] text-gray-500 dark:text-gray-300">
                                  <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Time</th>
                                    <th className="px-4 py-3">Campaign</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Hash</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                  {qrs
                                    .filter(q => q.status === 'redeemed' || q.status === 'claimed')
                                    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                                    .slice(0, 10)
                                    .map((qr) => (
                                      <tr key={qr.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                          <div className="font-medium text-gray-900 dark:text-white">Today</div>
                                          <div className="text-[10px] text-gray-500">
                                            {format(new Date(), 'h:mm a')}
                                            {/* Using current time as placeholder since API might not return update time yet */}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="truncate max-w-[150px] text-gray-900 dark:text-white">
                                            {qr.Campaign?.title || "Unknown Campaign"}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-emerald-400">
                                          ₹{formatAmount(getGeneratedPrice(qr))}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                                          {qr.uniqueHash.substring(0, 8)}...
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'brand' && (
                      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm dark:shadow-none" id="brand">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                            <Store size={18} className="text-emerald-400" />
                            Profile & Brand Settings
                          </div>
                          <button
                            onClick={() => alert("To change sensitive brand or company information, please contact administrator approval.")}
                            className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100 transition-colors border border-amber-200"
                          >
                            Request Change
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/10">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Note:</span> Brand Identity information is verified by admin. You cannot edit it directly.
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-medium text-gray-500 block mb-1">
                              Company name
                            </label>
                            <input
                              type="text"
                              value={companyProfile.businessName}
                              onChange={handleCompanyChange("businessName")}
                              placeholder="Legal company name"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Brand name
                            </label>
                            <input
                              type="text"
                              value={brandProfile.name}
                              readOnly
                              disabled
                              placeholder="Brand display name"
                              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Logo URL
                            </label>
                            <input
                              type="text"
                              value={brandProfile.logoUrl}
                              readOnly
                              disabled
                              placeholder="https://..."
                              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Website
                            </label>
                            <input
                              type="text"
                              value={brandProfile.website}
                              readOnly
                              disabled
                              placeholder="https://brand.com"
                              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 cursor-not-allowed"
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
                        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#111] p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold ${subscriptionBadgeClass}`}
                          >
                            {subscriptionStatusLabel}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400">
                            Plan: {subscriptionPlanLabel}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400">
                            Start: {subscriptionStartsAt}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400">
                            Ends: {subscriptionEndsAt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRegistrationSave}
                          disabled={isSavingRegistration}
                          className="w-full rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold py-2 shadow-none cursor-not-allowed border border-gray-200"
                          title="Contact admin to update company details"
                        >
                          Updates disabled (Admin Entry Only)
                        </button>
                        {registrationStatus && (
                          <div className="text-xs text-green-600 font-semibold">{registrationStatus}</div>
                        )}
                        {registrationError && (
                          <div className="text-xs text-red-600 font-semibold">{registrationError}</div>
                        )}
                      </div>
                    )}


                    {activeTab === 'campaigns' && (
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-4" id="campaigns">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            <BadgeCheck size={16} className="text-primary-strong" />
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

                        {/* Campaign Sub-tabs */}
                        <div className="flex border-b border-gray-200 dark:border-zinc-800">
                          <button
                            onClick={() => setCampaignTab('create')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${campaignTab === 'create'
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                          >
                            Create Campaign
                          </button>
                          <button
                            onClick={() => setCampaignTab('pending')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${campaignTab === 'pending'
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                          >
                            Pending Campaigns ({pendingCampaigns.length})
                          </button>
                          <button
                            onClick={() => setCampaignTab('active')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${campaignTab === 'active'
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                          >
                            Active Campaigns ({activeCampaigns.length})
                          </button>
                        </div>
                        {/* Create Campaign Tab */}
                        {campaignTab === 'create' && (
                          <div className="space-y-3">
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
                                Product
                              </label>
                              <select
                                value={campaignForm.productId}
                                onChange={handleCampaignChange("productId")}
                                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                              >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <textarea
                                rows="2"
                                value={campaignForm.description}
                                onChange={handleCampaignChange("description")}
                                placeholder="Short campaign summary"
                                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Allocations
                              </label>
                              {campaignRows.map((row, index) => (
                                <div key={row.id} className="grid grid-cols-12 gap-2 items-end">
                                  <div className="col-span-3 space-y-1">
                                    <label className="text-[10px] uppercase tracking-wide text-gray-400">Cashback</label>
                                    <input
                                      type="number"
                                      min="1"
                                      step="0.01"
                                      value={row.cashbackAmount}
                                      onChange={(e) => handleCampaignRowChange(row.id, "cashbackAmount", e.target.value)}
                                      placeholder="Amt"
                                      className="w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                  </div>
                                  <div className="col-span-4 space-y-1">
                                    <label className="text-[10px] uppercase tracking-wide text-gray-400">Quantity</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={row.quantity}
                                      onChange={(e) => handleCampaignRowChange(row.id, "quantity", e.target.value)}
                                      placeholder="Qty"
                                      className="w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                  </div>
                                  <div className="col-span-4 space-y-1">
                                    <label className="text-[10px] uppercase tracking-wide text-gray-400">Total (₹)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={formatAllocationTotal(row)}
                                      readOnly
                                      placeholder="Total"
                                      className="w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                                    />
                                  </div>
                                  <div className="col-span-1 pb-1.5 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCampaignRow(row.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                      aria-label="Remove row"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                    type="button"
                                    onClick={handleAddCampaignRow}
                                    className="text-xs font-semibold text-primary hover:text-primary-strong flex items-center gap-1"
                                  >
                                    <Plus size={14} />
                                    Add another allocation
                                  </button>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/40 px-3 py-2 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                Subtotal ({campaignAllocationSummary.quantity} QRs)
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                ₹{formatAmount(campaignAllocationSummary.subtotal)}
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              Campaign dates follow your subscription window.
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
                          </div>
                        )}

                        {/* Active Campaigns Tab */}
                        {campaignTab === 'active' && (
                          <div className="space-y-4">
                            {showQrGenerator && (
                            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  <QrCode size={16} className="text-primary-strong" />
                                  Generate QRs
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  Select a campaign and product to generate QR codes.
                                </div>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Campaign
                                  </label>
                                  <select
                                    value={selectedQrCampaign}
                                    onChange={(event) => setSelectedQrCampaign(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                                  >
                                    <option value="">Select campaign</option>
                                    {activeCampaigns.map((campaign) => (
                                      <option key={campaign.id} value={campaign.id}>
                                        {campaign.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Product
                                  </label>
                                  <select
                                    value={selectedQrProduct}
                                    onChange={(event) => setSelectedQrProduct(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                                  >
                                    <option value="">Select product</option>
                                    {products.map((product) => (
                                      <option key={product.id} value={product.id}>
                                        {product.name}{product.variant ? ` - ${product.variant}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={handleOrderQrs}
                                  disabled={!selectedQrCampaign || !selectedQrProduct || isOrdering}
                                  className="rounded-xl bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 shadow-lg hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  {isOrdering ? "Generating..." : "Generate QRs"}
                                </button>
                              </div>
                              {qrOrderStatus && (
                                <div className="text-xs text-green-600 font-semibold">{qrOrderStatus}</div>
                              )}
                              {qrOrderError && (
                                <div className="text-xs text-red-600 font-semibold">{qrOrderError}</div>
                              )}
                              {lastBatchSummary && (
                                <div className="rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-bold text-emerald-400">Order Invoice</div>
                                    <div className="text-xs text-gray-400">{format(new Date(lastBatchSummary.timestamp), "PPP p")}</div>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <div className="text-[10px] uppercase tracking-wide text-gray-500">Campaign</div>
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{lastBatchSummary.campaignTitle}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] uppercase tracking-wide text-gray-500">Quantity</div>
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{lastBatchSummary.totalQrs || 0} QRs</div>
                                    </div>
                                  </div>
                                  <div className="border-t border-emerald-600/30 pt-3 flex items-center justify-between gap-3">
                                    <div className="text-xs text-gray-400">
                                      Payment recorded. Admin will ship the QR codes after processing.
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const invoiceData = {
                                            id: lastBatchSummary.id,
                                            date: lastBatchSummary.timestamp,
                                            campaign: lastBatchSummary.campaignTitle,
                                            quantity: lastBatchSummary.totalQrs,
                                          };
                                          const invoiceText = `
INVOICE #${invoiceData.id}
Date: ${format(new Date(invoiceData.date), "PPP p")}
----------------------------------------
Campaign: ${invoiceData.campaign}
Quantity: ${invoiceData.quantity} QRs
----------------------------------------
                                      `.trim();
                                          const blob = new Blob([invoiceText], { type: 'text/plain' });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `invoice-${invoiceData.id}.txt`;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }}
                                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-600/30 hover:bg-emerald-600/10"
                                      >
                                        Download Invoice
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            )}

                            <div className="space-y-2">
                              {activeCampaigns.length === 0 ? (
                                <div className="text-xs text-center text-gray-500 py-4">No active campaigns found.</div>
                              ) : (
                                activeCampaigns.map((campaign) => {
                                  const allocationGroups = buildAllocationGroups(campaign.allocations);
                                  const totalQty = allocationGroups.reduce((sum, group) => sum + group.quantity, 0);
                                  const fallbackBudget = allocationGroups.reduce(
                                    (sum, group) => sum + group.totalBudget,
                                    0
                                  );
                                  const totalBudget = parseNumericValue(
                                    campaign.subtotal,
                                    parseNumericValue(campaign.totalBudget, fallbackBudget)
                                  );
                                  const stats = campaignQrMap.get(campaign.id);
                                  const activeCount = stats?.stats.active || 0;
                                  const redeemedCount = stats?.stats.redeemed || 0;
                                  const totalCount = stats?.stats.total || totalQty;

                                  return (
                                    <div
                                      key={campaign.id}
                                      className="rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 px-4 py-4 shadow-sm transition-colors transition-shadow hover:border-emerald-500/40 hover:shadow-md"
                                    >
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <div className="text-base font-semibold text-gray-900 dark:text-white">
                                              {campaign.title}
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
                                              Active
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                            ID: {campaign.id.slice(0, 10)}...
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedActiveCampaign(campaign)}
                                            className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors"
                                          >
                                            View Details
                                          </button>
                                        </div>
                                      </div>
                                      <div className="grid gap-2 sm:grid-cols-4">
                                        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/60 px-3 py-2">
                                          <div className="text-[10px] uppercase tracking-wide text-gray-500">Budget</div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            ₹{formatAmount(totalBudget)}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/60 px-3 py-2">
                                          <div className="text-[10px] uppercase tracking-wide text-gray-500">Total QRs</div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {totalCount || 0}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/60 px-3 py-2">
                                          <div className="text-[10px] uppercase tracking-wide text-gray-500">Active</div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {activeCount}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/60 px-3 py-2">
                                          <div className="text-[10px] uppercase tracking-wide text-gray-500">Redeemed</div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {redeemedCount}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] font-semibold">
                                        <button
                                          type="button"
                                          onClick={() => handleCopyCampaignId(campaign.id)}
                                          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                          Copy ID
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pending Campaigns Tab */}
                        {campaignTab === 'pending' && (
                          <div className="space-y-4">
                            {pendingCampaigns.length === 0 ? (
                              <div className="text-xs text-center text-gray-500 py-4">No pending campaigns found.</div>
                            ) : (
                              pendingCampaigns.map((campaign) => {
                                const allocationGroups = buildAllocationGroups(campaign.allocations);
                                const totalQty = allocationGroups.reduce((sum, group) => sum + group.quantity, 0);
                                const fallbackBudget = allocationGroups.reduce(
                                  (sum, group) => sum + group.totalBudget,
                                  0
                                );
                                const totalBudget = parseNumericValue(
                                  campaign.subtotal,
                                  parseNumericValue(campaign.totalBudget, fallbackBudget)
                                );
                                return (
                                  <div
                                    key={campaign.id}
                                    className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                  >
                                    <div className="bg-gradient-to-r from-amber-600/20 to-amber-600/10 px-4 py-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Megaphone size={18} className="text-amber-400" />
                                          <div>
                                            <span className="text-base font-bold text-gray-900 dark:text-white">
                                              {campaign.title}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                          <span className="px-2 py-1 rounded-full bg-amber-600/20 text-amber-400 font-semibold">
                                            Pending
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedPendingCampaign(campaign)}
                                            className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-colors"
                                          >
                                            Request Print
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-[#0f0f0f] divide-y divide-gray-200 dark:divide-gray-800">
                                      {allocationGroups.length === 0 ? (
                                        <div className="p-4 text-xs text-gray-500">
                                          No allocations configured yet.
                                        </div>
                                      ) : (
                                        allocationGroups.map((group) => {
                                          const groupKey = `${campaign.id}-${group.price.toFixed(2)}`;
                                          return (
                                            <div key={groupKey} className="p-4">
                                              <div className="flex items-center">
                                                <div className="flex items-center gap-4">
                                                  <div>
                                                    <div className="text-xs text-gray-500">Cashback Amount</div>
                                                    <div className="text-lg font-bold text-emerald-400">
                                                      ₹{formatAmount(group.price)}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-xs text-gray-500">Quantity</div>
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                      {group.quantity} QRs
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    <div className="px-4 py-3 text-[10px] text-gray-500 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#0f0f0f]">
                                      <span>
                                        Total: {totalQty} QR{totalQty !== 1 ? "s" : ""} - Budget ₹
                                        {formatAmount(totalBudget)}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => handleCopyCampaignId(campaign.id)}
                                          className="text-gray-600 dark:text-gray-300 font-semibold"
                                        >
                                          Copy ID
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}



                        {/* Pending Campaign Details Modal */}
                        {selectedPendingCampaign && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-zinc-800">
                              <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPendingCampaign.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {format(new Date(selectedPendingCampaign.startDate), 'MMM dd')} - {format(new Date(selectedPendingCampaign.endDate), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                  <button onClick={() => setSelectedPendingCampaign(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                  </button>
                                </div>

                                {selectedPendingCampaign.description && (
                                  <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    {selectedPendingCampaign.description}
                                  </div>
                                )}

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Package size={16} className="text-primary" />
                                    Allocations Breakdown
                                  </h4>
                                  <div className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500 font-medium">
                                        <tr>
                                          <th className="px-4 py-3">Cashback</th>
                                          <th className="px-4 py-3 text-center">Qty</th>
                                          <th className="px-4 py-3 text-right">Budget</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {(selectedPendingCampaign.allocations || []).map((alloc, idx) => (
                                          <tr key={idx} className="bg-white dark:bg-zinc-900">
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">₹{alloc.cashbackAmount}</td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{alloc.quantity}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">₹{alloc.totalBudget}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-gray-50 dark:bg-zinc-800/30 font-semibold text-gray-900 dark:text-white">
                                        <tr>
                                          <td className="px-4 py-3">Subtotal</td>
                                          <td className="px-4 py-3 text-center">
                                            {(selectedPendingCampaign.allocations || []).reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)} QRs
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            ₹{parseFloat(selectedPendingCampaign.subtotal || selectedPendingCampaign.totalBudget || 0).toFixed(2)}
                                          </td>
                                        </tr>
                                        {/* QR Generation Cost Row */}
                                        <tr>
                                          <td className="px-4 py-3 text-gray-500 font-normal">
                                            QR Generation Cost (₹1/QR)
                                          </td>
                                          <td className="px-4 py-3 text-center text-gray-500 font-normal">
                                            -
                                          </td>
                                          <td className="px-4 py-3 text-right font-normal text-gray-600 dark:text-gray-400">
                                            + ₹{(selectedPendingCampaign.allocations || []).reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0).toFixed(2)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Wallet Balance</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">₹{wallet?.balance || "0.00"}</span>
                                  </div>
                                  <div className="h-px bg-emerald-200 dark:bg-emerald-800/30"></div>
                                  <div className="flex items-center justify-between text-base font-bold text-emerald-700 dark:text-emerald-400">
                                    <span>Total Payable</span>
                                    <span>
                                      ₹{(
                                        parseFloat(selectedPendingCampaign.subtotal || selectedPendingCampaign.totalBudget || 0) +
                                        ((selectedPendingCampaign.allocations || []).reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0) * 1)
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                  <button
                                    onClick={() => setSelectedPendingCampaign(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handlePayCampaign(selectedPendingCampaign)}
                                    disabled={isPayingCampaign}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {isPayingCampaign ? (
                                      <>Processing...</>
                                    ) : (
                                      <>
                                        <Wallet size={18} />
                                        Pay & Activate
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Active Campaign Details Modal */}
                        {activeCampaignDetails && activeCampaign && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-zinc-800">
                              <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                      {activeCampaign.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {formatShortDate(activeCampaign.startDate)} - {formatShortDate(activeCampaign.endDate)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setSelectedActiveCampaign(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                  >
                                    <X size={20} className="text-gray-500" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                                    Active
                                  </span>
                                  <span>ID: {activeCampaign.id}</span>
                                  {activeCampaignDetails.product && (
                                    <span>
                                      Product: {activeCampaignDetails.product.name}
                                      {activeCampaignDetails.product.variant ? ` - ${activeCampaignDetails.product.variant}` : ""}
                                    </span>
                                  )}
                                </div>

                                {activeCampaign.description && (
                                  <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    {activeCampaign.description}
                                  </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 p-3">
                                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Budget</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      ₹{formatAmount(activeCampaignDetails.totalBudget)}
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 p-3">
                                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Total QRs</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {activeCampaignDetails.stats?.stats.total || activeCampaignDetails.totalQty || 0}
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 p-3">
                                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Redeemed</div>
                                    <div className="text-lg font-bold text-emerald-500">
                                      {activeCampaignDetails.stats?.stats.redeemed || 0}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Active QRs: {activeCampaignDetails.stats?.stats.active || 0} - Redeemed:{" "}
                                  {activeCampaignDetails.stats?.stats.redeemed || 0}
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Package size={16} className="text-primary" />
                                    {activeCampaignDetails.stats?.stats.total ? "QR Breakdown" : "Allocation Breakdown"}
                                  </h4>
                                  <div className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500 font-medium">
                                        <tr>
                                          <th className="px-4 py-3">Cashback</th>
                                          <th className="px-4 py-3 text-center">Qty</th>
                                          <th className="px-4 py-3 text-center">Active</th>
                                          <th className="px-4 py-3 text-center">Redeemed</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {activeCampaignDetails.breakdownRows.map((row, idx) => (
                                          <tr key={`${activeCampaign.id}-${idx}`} className="bg-white dark:bg-zinc-900">
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                              ₹{formatAmount(row.cashback)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                              {row.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                              {row.active || 0}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                              {row.redeemed || 0}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                  <button
                                    onClick={() => setSelectedActiveCampaign(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                  >
                                    Close
                                  </button>
                                  <button
                                    onClick={() => handleCopyCampaignId(activeCampaign.id)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity"
                                  >
                                    Copy Campaign ID
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {showQrOrdersSection && (
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm dark:shadow-none space-y-4" id="qr-inventory">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-base font-bold text-white">
                              <ClipboardCheck size={18} className="text-emerald-400" />
                              QR Orders
                            </div>
                            <div className="flex items-center gap-2">
                              {qrHasMore && (
                                <button
                                  type="button"
                                  onClick={() => loadQrs(token, { page: qrPage + 1, append: true })}
                                  disabled={isLoadingQrs}
                                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white"
                                >
                                  <Download size={12} />
                                  Load more
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => loadQrs(token, { page: 1, append: false })}
                                disabled={isLoadingQrs}
                                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white"
                              >
                                <RefreshCw size={12} />
                                Refresh
                              </button>
                            </div>
                          </div>
                          {isLoadingQrs && (
                            <div className="text-xs text-gray-400">Loading orders...</div>
                          )}
                          {qrError && <div className="text-xs text-red-500 font-semibold">{qrError}</div>}
                          {!isLoadingQrs && qrs.length === 0 && (
                            <div className="text-xs text-gray-500">No QR orders yet. Generate QRs above.</div>
                          )}
                          {showOrderTracking && (
                            <>
                              {isLoadingOrders && (
                                <div className="text-xs text-gray-400">Loading order status...</div>
                              )}
                              {ordersError && <div className="text-xs text-red-500 font-semibold">{ordersError}</div>}
                              {!isLoadingOrders && ordersTotal === 0 && orders.length === 0 && (
                                <div className="text-xs text-gray-500">No print orders logged yet.</div>
                              )}
                              {orders.length > 0 && (
                                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100 dark:bg-zinc-800/60 text-gray-500 uppercase text-[10px]">
                                      <tr>
                                        <th className="px-3 py-2 text-left">Order</th>
                                        <th className="px-3 py-2 text-left">Campaign</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-left">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                      {orders.map((order) => (
                                        <tr key={order.id}>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200 font-medium">
                                            {order.id.slice(0, 8)}...
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                            {order.campaignTitle || "Campaign"}
                                          </td>
                                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                                            {order.quantity}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                            <span className={getStatusClasses(order.status)}>
                                              {order.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {ordersHasMore && (
                                <button
                                  type="button"
                                  onClick={() => loadOrders(token, { page: ordersPage + 1, append: true })}
                                  disabled={isLoadingOrders}
                                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                  Load more orders
                                </button>
                              )}
                            </>
                          )}

                          {/* Order Summary by Campaign */}
                          {qrsGroupedByCampaign.length > 0 && (
                            <div className="space-y-3">
                              {qrsGroupedByCampaign.map((campaign) => (
                                <div key={campaign.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                  {/* Campaign Header */}
                                  <div className="bg-gradient-to-r from-emerald-600/30 to-emerald-600/10 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Megaphone size={18} className="text-emerald-400" />
                                        <div>
                                          <span className="text-base font-bold text-gray-900 dark:text-white">{campaign.title}</span>
                                          {campaign.endDate && (
                                            <span className="ml-2 text-xs text-gray-400">
                                              Expires: {format(new Date(campaign.endDate), 'MMM dd, yyyy')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                        <span className="px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 font-semibold">
                                          {campaign.stats.active} Active
                                        </span>
                                        <span className="px-2 py-1 rounded-full bg-gray-600/20 text-gray-400 font-semibold">
                                          {campaign.stats.redeemed} Redeemed
                                        </span>
                                        <span className="text-gray-500">
                                          Total: {campaign.stats.total}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Summary (No QR Images) */}
                                  <div className="bg-gray-50 dark:bg-[#0f0f0f] divide-y divide-gray-200 dark:divide-gray-800">
                                    {campaign.priceGroups.map((priceGroup) => {
                                      const groupKey = `${campaign.id}-${priceGroup.priceKey ?? priceGroup.price}`;
                                      return (
                                        <div key={groupKey} className="p-4">
                                          <div className="flex items-center">
                                            <div className="flex items-center gap-4">
                                              <div>
                                                <div className="text-xs text-gray-500">Cashback Amount</div>
                                                <div className="text-lg font-bold text-emerald-400">₹{formatAmount(priceGroup.price)}</div>
                                              </div>
                                              <div>
                                                <div className="text-xs text-gray-500">Quantity</div>
                                                <div className="text-lg font-bold text-gray-900 dark:text-white">{priceGroup.qrs.length} QRs</div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="text-[10px] text-gray-500 flex items-center justify-between">
                            <span>
                              Total: {qrTotalLabel} QR{qrTotalLabel !== 1 ? 's' : ''} across {qrsGroupedByCampaign.length} campaign{qrsGroupedByCampaign.length !== 1 ? 's' : ''}
                              {qrCoverageLabel ? ` - ${qrCoverageLabel}` : ''}
                            </span>
                            <span>{qrStats.redeemed} redeemed - {qrStats.active} active</span>
                          </div>
                          {qrActionStatus && (
                            <div className="text-xs text-green-600 font-semibold">{qrActionStatus}</div>
                          )}
                        </div>
                        )}
                      </div>
                    )}


                    {/* Products Section */}
                    {activeTab === 'products' && (
                      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm dark:shadow-none space-y-4" id="products">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                            <Package size={18} className="text-emerald-400" />
                            Products
                          </div>
                          <button
                            type="button"
                            onClick={() => loadProducts()}
                            disabled={isLoadingProducts}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white"
                          >
                            <RefreshCw size={12} />
                            Refresh
                          </button>
                        </div>

                        {/* Add Product Form */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Product name *</label>
                            <input
                              type="text"
                              value={productForm.name}
                              onChange={handleProductChange("name")}
                              placeholder="e.g. Product XYZ"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Variant</label>
                            <input
                              type="text"
                              value={productForm.variant}
                              onChange={handleProductChange("variant")}
                              placeholder="e.g. 500ml, Red, Large"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Category</label>
                            <input
                              type="text"
                              value={productForm.category}
                              onChange={handleProductChange("category")}
                              placeholder="e.g. Beverages, Electronics"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Image URL</label>
                            <input
                              type="text"
                              value={productForm.imageUrl}
                              onChange={handleProductChange("imageUrl")}
                              placeholder="https://..."
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-gray-500">Description</label>
                          <textarea
                            rows="2"
                            value={productForm.description}
                            onChange={handleProductChange("description")}
                            placeholder="Product description..."
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          disabled={isSavingProduct}
                          className="w-full rounded-lg bg-emerald-600 text-white text-sm font-semibold py-2.5 shadow-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                        >
                          {isSavingProduct ? "Adding..." : "Add Product"}
                        </button>
                        {productStatus && (
                          <div className="text-xs text-green-500 font-semibold">{productStatus}</div>
                        )}
                        {productError && (
                          <div className="text-xs text-red-500 font-semibold">{productError}</div>
                        )}

                        {/* Products List */}
                        {isLoadingProducts ? (
                          <div className="text-xs text-gray-400">Loading products...</div>
                        ) : products.length === 0 ? (
                          <div className="text-xs text-gray-500">No products yet. Add your first product above.</div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                            <table className="w-full text-xs">
                              <thead className="bg-emerald-600 text-white">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                                  <th className="px-3 py-2 text-left font-semibold">Variant</th>
                                  <th className="px-3 py-2 text-left font-semibold">Category</th>
                                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {products.map((product, idx) => (
                                  <tr key={product.id} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-[#1a1a1a]' : 'bg-white dark:bg-[#0f0f0f]'}>
                                    <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{product.name}</td>
                                    <td className="px-3 py-2 text-gray-400">{product.variant || '-'}</td>
                                    <td className="px-3 py-2 text-gray-400">{product.category || '-'}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${product.status === 'active'
                                        ? 'bg-emerald-600/20 text-emerald-400'
                                        : 'bg-gray-600/20 text-gray-400'
                                        }`}>
                                        {product.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="text-[10px] text-gray-500">
                          Total: {products.length} product{products.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    {activeTab === 'wallet' && (
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3" id="wallet">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                          <Wallet size={16} className="text-primary-strong" />
                          Wallet controls
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">Balance</div>
                            <div
                              className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-normal break-words"
                              title={`INR ${formatAmount(walletBalance)}`}
                            >
                              INR {formatCompactAmount(walletBalance)}
                            </div>
                          </div>
                          <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              Locked balance
                            </div>
                            <div
                              className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-normal break-words"
                              title={`INR ${formatAmount(lockedBalance)}`}
                            >
                              INR {formatCompactAmount(lockedBalance)}
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
                            className="w-full rounded-lg bg-emerald-600 text-white text-sm font-semibold py-2.5 shadow-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                          >
                            {isRecharging ? "Recharging..." : "Recharge wallet"}
                          </button>
                        </div>
                        {walletStatus && (
                          <div className="text-xs text-green-600 font-semibold">{walletStatus}</div>
                        )}
                        {walletError && <div className="text-xs text-red-600 font-semibold">{walletError}</div>}
                      </div>
                    )}

                    {activeTab === 'scan' && (
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3" id="scan">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                          <ScanLine size={16} className="text-primary-strong" />
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
                            className="w-full rounded-xl bg-primary text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
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
                    )}


                  </main>
                </div>
              </div>
              {/* QR Preview Modal Start */}
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
                        className="rounded-xl bg-primary text-white py-2"
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
            </>
          )
          }
        </>
      )}
    </div >
  );
};

export default VendorDashboard;
