import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import {
  Activity,
  ArrowLeftRight,
  BarChart2,
  BarChart3,
  Banknote,
  Bell,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  HandCoins,
  LayoutGrid,
  LogOut,
  Menu,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  PiggyBank,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Zap,
  X,
} from "lucide-react";
import { ModeToggle } from "../components/ModeToggle";

import AdminSidebar from "../components/AdminSidebar";
import BalanceCard from "../components/BalanceCard";
import CashbackRewardsCard from "../components/CashbackRewardsCard";
import RecentActivitiesCard from "../components/RecentActivitiesCard";
import ServiceIconGrid from "../components/ServiceIconGrid";
import ActionButtonGroup from "../components/ActionButtonGroup";
import EarnRewardCard from "../components/EarnRewardCard";
import { useTheme } from "../components/ThemeProvider";
import VendorAccountManager from "../components/admin/VendorAccountManager";
import {
  loginWithEmail,
  getMe,
  getAdminDashboard,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminVendors,
  getAdminBrands,
  uploadImage,
  getAdminVendorOverview,
  updateAdminVendorDetails,
  getAdminBrandOverview,
  updateAdminBrandDetails,
  updateAdminCampaignDetails,
  getAdminCampaignAnalytics,
  getAdminCampaigns,
  createAdminBrand,
  updateAdminVendorStatus,
  updateAdminBrandStatus,
  adjustVendorWalletAdmin,
  updateAdminCampaignStatus,
  deleteAdminCampaign,
  getAdminOrders,
  getAdminQrBatch,
  updateAdminOrderStatus,
  getAdminTransactions,
  getAdminTransactionsFiltered,
  getAdminQrs,
  getAdminWithdrawals,
  getAdminNotifications,
  processAdminWithdrawal,
  getAdminSubscriptions,
  updateAdminVendorSubscription,
} from "../lib/api";

const ADMIN_TOKEN_KEY = "cashback_admin_token";
const ADMIN_SIDEBAR_KEY = "cashback_admin_sidebar";
const MAX_QR_PRICE = 100;

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "operations", label: "Operations", icon: Wallet },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "orders", label: "Orders", icon: Package },
  { id: "payouts", label: "Payouts", icon: CircleDollarSign },
  { id: "users", label: "Users", icon: Users },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "transactions", label: "Transactions", icon: ClipboardList },
  { id: "qrs", label: "QR Registry", icon: QrCode },
];

const quickActions = [
  { id: "operations", label: "Wallet", icon: PiggyBank },
  { id: "payouts", label: "Payouts", icon: HandCoins },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "users", label: "Users", icon: UserRound },
  { id: "vendors", label: "Vendors", icon: Building2 },
  { id: "transactions", label: "Transfers", icon: ArrowLeftRight },
  { id: "qrs", label: "QRs", icon: ScanLine },
];

const rangeOptions = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

const metricOptions = [
  { label: "Net flow", value: "transactions" },
  { label: "New users", value: "users" },
  { label: "QR volume", value: "qrs" },
];

const subscriptionOptions = [
  { label: "6 Months", value: "MONTHS_6" },
  { label: "12 Months", value: "MONTHS_12" },
  { label: "24 Months", value: "MONTHS_24" },
];

const subscriptionFilterOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Expired", value: "expired" },
];

const QR_ORDER_ATTENTION_STATUSES = ['pending', 'paid'];

const formatAmount = (value) => {
  if (value === undefined || value === null) return "0.00";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric.toFixed(2);
  return String(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getDefaultBrandFormState = () => ({
  brandName: "",
  logoUrl: "",
  website: "",
  subscriptionDuration: "MONTHS_12",
  vendorEmail: "",
  vendorPhone: "",
  qrPricePerUnit: "1.00",
});

const getDefaultCampaignEditFormState = () => ({
  id: "",
  title: "",
  description: "",
  cashbackAmount: "",
  startDate: "",
  endDate: "",
  totalBudget: "",
  subtotal: "",
});

const getDefaultSubscriptionFormState = () => ({
  vendorId: "",
  action: "renew",
  subscriptionType: "MONTHS_12",
  extendMonths: "",
});

const getDefaultWithdrawalActionState = () => ({
  id: "",
  status: "processed",
  referenceId: "",
  adminNote: "",
});

const getDefaultWalletCreditState = () => ({
  vendorId: "",
  amount: "",
  description: "",
  type: "credit",
});

const getDefaultCampaignControlState = () => ({
  id: "",
  status: "paused",
});


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

const getQrCanvasId = (hash) => `admin-qr-canvas-${hash}`;
const getBatchCanvasId = (hash) => `admin-qr-batch-${hash}`;

const getStatusClasses = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["active", "success", "processed", "completed", "paid", "shipped"].includes(normalized)) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (["pending"].includes(normalized)) {
    return "text-amber-600 dark:text-amber-400";
  }
  if (["paused", "inactive"].includes(normalized)) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  if (["rejected", "blocked", "failed", "expired"].includes(normalized)) {
    return "text-rose-600 dark:text-rose-400";
  }
  return "text-slate-500 dark:text-slate-400";
};

const extractCampaignTitle = (description) => {
  if (!description) return "-";
  const cleaned = String(description).trim();
  const match = cleaned.match(/Campaign[:\s]+([^.,;]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return cleaned.length > 60 ? `${cleaned.slice(0, 60).trim()}…` : cleaned;
};

const adminPanelClass =
  "bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl shadow-sm transition-all duration-200";
const adminCardClass =
  "bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm";
const adminInputClass =
  "w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-[#81cc2a] transition-colors";
const adminOptionClass = "bg-white text-slate-900 dark:bg-[#0f0f11] dark:text-white";
const adminPrimaryButtonClass =
  "px-6 py-2.5 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-white font-semibold shadow-lg shadow-[#81cc2a]/20 transition-all";
const adminGhostButtonClass =
  "px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 font-medium transition-colors dark:bg-white/5 dark:hover:bg-white/10 dark:text-white";
const statLabelClass = "text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2";
const statValueClass = "text-2xl font-bold text-slate-900 dark:text-white";

const getDayKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDayBuckets = (days) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  const buckets = [];
  const indexMap = new Map();

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = getDayKey(date);
    buckets.push({ date, key });
    indexMap.set(key, i);
  }

  return { buckets, indexMap, start, end: today };
};

const buildTransactionSeries = (transactions, days) => {
  const { buckets, indexMap } = buildDayBuckets(days);
  const credit = new Array(days).fill(0);
  const debit = new Array(days).fill(0);

  transactions.forEach((tx) => {
    const date = new Date(tx.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const index = indexMap.get(getDayKey(date));
    if (index === undefined) return;

    const amount = Number(tx.amount) || 0;
    if (tx.type === "credit") credit[index] += amount;
    if (tx.type === "debit") debit[index] += amount;
  });

  const net = credit.map((value, index) => value - debit[index]);

  return { buckets, credit, debit, net };
};

const buildCountSeries = (items, days, getDate) => {
  const { buckets, indexMap } = buildDayBuckets(days);
  const counts = new Array(days).fill(0);

  items.forEach((item) => {
    const dateValue = getDate(item);
    if (!dateValue) return;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return;
    const index = indexMap.get(getDayKey(date));
    if (index === undefined) return;
    counts[index] += 1;
  });

  return { buckets, counts };
};

const buildStatusCounts = (items, key) =>
  items.reduce((acc, item) => {
    const status = String(item?.[key] || "unknown").toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

const Sparkline = ({ data, stroke = "#81cc2a", fill = "rgba(129, 204, 42, 0.2)" }) => {
  if (!data || data.length === 0) {
    return <div className="h-16 w-full rounded-2xl bg-slate-200/70 dark:bg-white/10" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = data.length > 1 ? data.length - 1 : 1;
  const points = data
    .map((value, index) => {
      const x = (index / width) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${points} 100,100 0,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-16 w-full">
      <polygon points={areaPoints} fill={fill} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { section, subSection } = useParams();
  const { effectiveTheme } = useTheme();
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const isAuthenticated = Boolean(token);
  const [adminInfo, setAdminInfo] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userStatusUpdates, setUserStatusUpdates] = useState({});
  const [userActionStatus, setUserActionStatus] = useState("");
  const [userActionError, setUserActionError] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [vendorsError, setVendorsError] = useState("");
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vendorStatusUpdates, setVendorStatusUpdates] = useState({});
  const [vendorActionStatus, setVendorActionStatus] = useState("");
  const [vendorActionError, setVendorActionError] = useState("");
  const [brandForm, setBrandForm] = useState(() => getDefaultBrandFormState());
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
  const [brandLogoUploadStatus, setBrandLogoUploadStatus] = useState("");
  const [brandLogoUploadError, setBrandLogoUploadError] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [brandCreationMessage, setBrandCreationMessage] = useState("");
  const [brandCreationError, setBrandCreationError] = useState("");
  const [createdBrandCredentials, setCreatedBrandCredentials] = useState(null);
  const [createdBrandDetails, setCreatedBrandDetails] = useState(null);
  const [showAllVendors, setShowAllVendors] = useState(false);
  const [brands, setBrands] = useState([]);
  const [brandsError, setBrandsError] = useState("");
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  /* Vendor & Brand Overview State Removed (Refactored to VendorAccountManager) */
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [campaignAnalyticsId, setCampaignAnalyticsId] = useState("");
  const [campaignAnalytics, setCampaignAnalytics] = useState(null);
  const [campaignAnalyticsError, setCampaignAnalyticsError] = useState("");
  const [isLoadingCampaignAnalytics, setIsLoadingCampaignAnalytics] = useState(false);
  const [campaignEditForm, setCampaignEditForm] = useState(() => getDefaultCampaignEditFormState());
  const [campaignEditStatus, setCampaignEditStatus] = useState("");
  const [campaignEditError, setCampaignEditError] = useState("");
  const [isUpdatingCampaignDetails, setIsUpdatingCampaignDetails] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState(() => getDefaultSubscriptionFormState());
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [transactionsError, setTransactionsError] = useState("");
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Dashboard Filters
  const [filterVendorId, setFilterVendorId] = useState("all");
  const [filterBrandId, setFilterBrandId] = useState("all");
  const [filterCampaignId, setFilterCampaignId] = useState("all");

  const [qrs, setQrs] = useState([]);
  const [qrsError, setQrsError] = useState("");
  const [isLoadingQrs, setIsLoadingQrs] = useState(false);
  const [showAllQrs, setShowAllQrs] = useState(false);
  const [qrsPage, setQrsPage] = useState(1);
  const [qrsTotal, setQrsTotal] = useState(0);
  const [qrStatusSummary, setQrStatusSummary] = useState({});
  const [qrsHasMore, setQrsHasMore] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsError, setWithdrawalsError] = useState("");
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [withdrawalAction, setWithdrawalAction] = useState(() => getDefaultWithdrawalActionState());
  const [withdrawalStatus, setWithdrawalStatus] = useState("");
  const [withdrawalError, setWithdrawalError] = useState("");
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [walletCredit, setWalletCredit] = useState(() => getDefaultWalletCreditState());
  const [walletStatus, setWalletStatus] = useState("");
  const [walletError, setWalletError] = useState("");
  const [isCreditingWallet, setIsCreditingWallet] = useState(false);

  const [campaignControl, setCampaignControl] = useState(() => getDefaultCampaignControlState());
  const [campaignStatus, setCampaignStatus] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsError, setCampaignsError] = useState("");
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [campaignStatusUpdates, setCampaignStatusUpdates] = useState({});
  const [campaignActionStatus, setCampaignActionStatus] = useState("");
  const [campaignActionError, setCampaignActionError] = useState("");
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderStatusUpdates, setOrderStatusUpdates] = useState({});
  const [orderActionStatus, setOrderActionStatus] = useState("");
  const [orderActionError, setOrderActionError] = useState("");
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [qrBatchStatus, setQrBatchStatus] = useState("");
  const [qrBatchError, setQrBatchError] = useState("");
  const [qrBatchSearch, setQrBatchSearch] = useState("");
  const [qrBatchSort, setQrBatchSort] = useState("recent");
  const [showAllQrBatches, setShowAllQrBatches] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderStatusSummary, setOrderStatusSummary] = useState({});
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [batchQrs, setBatchQrs] = useState([]);
  const [isPreparingBatchPdf, setIsPreparingBatchPdf] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(ADMIN_SIDEBAR_KEY);
    return saved === "collapsed" ? true : false; // Default to expanded
  });
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [analyticsMetric, setAnalyticsMetric] = useState("transactions");
  const [searchQuery, setSearchQuery] = useState("");

  const clearSession = (message = "") => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    setToken(null);
    setAdminInfo(null);
    setEmail("");
    setPassword("");
    setAuthStatus(message || "");
    setAuthError("");
    setIsSigningIn(false);
    setDashboardStats(null);
    setDashboardError("");
    setIsLoadingDashboard(false);
    setUsers([]);
    setUsersError("");
    setIsLoadingUsers(false);
    setUserStatusUpdates({});
    setUserActionStatus("");
    setUserActionError("");
    setShowAllUsers(false);
    setVendors([]);
    setVendorsError("");
    setIsLoadingVendors(false);
    setVendorStatusUpdates({});
    setVendorActionStatus("");
    setVendorActionError("");
    setBrandForm(getDefaultBrandFormState());
    setIsCreatingBrand(false);
    setBrandCreationMessage("");
    setBrandCreationError("");
    setCreatedBrandCredentials(null);
    setCreatedBrandDetails(null);
    setShowAllVendors(false);
    setBrands([]);
    setBrandsError("");
    setIsLoadingBrands(false);
    setSelectedVendorId("");
    setSelectedBrandId("");
    setIsAccountModalOpen(false);
    setCampaignAnalyticsId("");
    setCampaignAnalytics(null);
    setCampaignAnalyticsError("");
    setIsLoadingCampaignAnalytics(false);
    setCampaignEditForm(getDefaultCampaignEditFormState());
    setCampaignEditStatus("");
    setCampaignEditError("");
    setIsUpdatingCampaignDetails(false);
    setSubscriptionForm(getDefaultSubscriptionFormState());
    setIsUpdatingSubscription(false);
    setSubscriptionMessage("");
    setSubscriptionError("");
    setSubscriptionFilter("all");
    setSubscriptions([]);
    setIsLoadingSubscriptions(false);
    setSubscriptionsError("");
    setTransactions([]);
    setTransactionsError("");
    setIsLoadingTransactions(false);
    setShowAllTransactions(false);
    setQrs([]);
    setQrsError("");
    setIsLoadingQrs(false);
    setShowAllQrs(false);
    setQrsPage(1);
    setQrsTotal(0);
    setQrStatusSummary({});
    setQrsHasMore(false);
    setWithdrawals([]);
    setWithdrawalsError("");
    setIsLoadingWithdrawals(false);
    setWithdrawalAction(getDefaultWithdrawalActionState());
    setWithdrawalStatus("");
    setWithdrawalError("");
    setShowAllWithdrawals(false);
    setWalletCredit(getDefaultWalletCreditState());
    setWalletStatus("");
    setWalletError("");
    setIsCreditingWallet(false);
    setCampaignControl(getDefaultCampaignControlState());
    setCampaignStatus("");
    setCampaignError("");
    setIsUpdatingCampaign(false);
    setCampaigns([]);
    setCampaignsError("");
    setIsLoadingCampaigns(false);
    setCampaignStatusUpdates({});
    setCampaignActionStatus("");
    setCampaignActionError("");
    setShowAllCampaigns(false);
    setDeletingCampaignId(null);
    setOrders([]);
    setOrdersError("");
    setIsLoadingOrders(false);
    setOrderStatusUpdates({});
    setOrderActionStatus("");
    setOrderActionError("");
    setShowAllOrders(false);
    setQrBatchStatus("");
    setQrBatchError("");
    setQrBatchSearch("");
    setQrBatchSort("recent");
    setShowAllQrBatches(false);
    setOrdersPage(1);
    setOrdersTotal(0);
    setOrderStatusSummary({});
    setOrdersHasMore(false);
    setBatchQrs([]);
    setIsPreparingBatchPdf(false);
    setIsRefreshing(false);
    setSidebarOpen(false);
    setAnalyticsRange(30);
    setAnalyticsMetric("transactions");
    setSearchQuery("");
  };

  const activeSection = section || "overview";
  const activeSubSection = subSection || "";
  const activeNav =
    activeSection === "vendors" && activeSubSection
      ? `vendors-${activeSubSection}`
      : activeSection;

  const isOverviewRoute = activeSection === "overview";
  const isAnalyticsRoute = activeSection === "analytics";
  const isOperationsRoute = activeSection === "operations";
  const isCampaignsRoute = activeSection === "campaigns";
  const isOrdersRoute = activeSection === "orders";
  const isPayoutsRoute = activeSection === "payouts";
  const isUsersRoute = activeSection === "users";
  const isTransactionsRoute = activeSection === "transactions";
  const isQrsRoute = activeSection === "qrs";
  const isVendorsRoute = activeSection === "vendors";
  const isSubscriptionsRoute = activeSection === "subscriptions";

  const vendorView = isVendorsRoute ? activeSubSection || "all" : "all";
  const showBrandCreation = isVendorsRoute && (vendorView === "all" || vendorView === "create");
  const showVendorSummaries = isVendorsRoute && vendorView === "all";
  const showSubscriptionControls = isSubscriptionsRoute || (isVendorsRoute && vendorView === "all");
  const showVendorTable = isVendorsRoute && vendorView !== "create";
  const shouldRenderVendorsSection = isVendorsRoute || isSubscriptionsRoute;

  const subscriptionBuckets = useMemo(() => {
    const buckets = { active: [], paused: [], expired: [] };
    subscriptions.forEach((subscription) => {
      const status = String(subscription?.status || "active").toLowerCase();
      if (status === "paused") {
        buckets.paused.push(subscription);
      } else if (status === "expired") {
        buckets.expired.push(subscription);
      } else {
        buckets.active.push(subscription);
      }
    });
    return buckets;
  }, [subscriptions]);

  const subscriptionCounts = useMemo(
    () => ({
      active: subscriptionBuckets.active.length,
      paused: subscriptionBuckets.paused.length,
      expired: subscriptionBuckets.expired.length,
    }),
    [subscriptionBuckets]
  );

  const withdrawalPreview = useMemo(() => {
    if (!withdrawals?.length) return [];
    const pending = withdrawals.filter((w) => String(w.status || "").toLowerCase() === "pending");
    if (showAllWithdrawals) {
      return pending.length ? pending : withdrawals;
    }
    if (pending.length) {
      return pending.slice(0, 3);
    }
    return withdrawals.slice(0, 3);
  }, [withdrawals, showAllWithdrawals]);

  const navRouteMap = {
    overview: "/admin/overview",
    analytics: "/admin/analytics",
    operations: "/admin/operations",
    campaigns: "/admin/campaigns",
    orders: "/admin/orders",
    payouts: "/admin/payouts",
    users: "/admin/users",
    vendors: "/admin/vendors",
    "vendors-create": "/admin/vendors/create",
    "vendors-active": "/admin/vendors/active",
    "vendors-paused": "/admin/vendors/paused",
    subscriptions: "/admin/subscriptions",
    transactions: "/admin/transactions",
    qrs: "/admin/qrs",
    account: "/admin/account",
    security: "/admin/security",
  };

  const pageTitleMap = {
    overview: "Overview",
    analytics: "Analytics",
    operations: "Operations",
    campaigns: "Campaigns",
    orders: "Orders",
    payouts: "Payouts",
    users: "Users",
    vendors: "Vendors",
    subscriptions: "Subscriptions",
    transactions: "Transactions",
    qrs: "QR Registry",
    account: "Account",
    security: "Security",
  };
  const vendorSubTitleMap = {
    create: "Create Brand",
    active: "Active Vendors",
    paused: "Paused Vendors",
  };
  const headerTitle =
    activeSection === "vendors" && activeSubSection
      ? `${pageTitleMap.vendors} - ${vendorSubTitleMap[activeSubSection] || activeSubSection}`
      : pageTitleMap[activeSection] || "Admin";

  const handleRequestError = (err, setter, fallback) => {
    if (err?.status === 401) {
      clearSession("Session expired.");
    } else {
      setter(err.message || fallback);
    }
  };

  const loadAdmin = async (authToken) => {
    try {
      const data = await getMe(authToken);
      if (data?.role && data.role !== "admin") {
        clearSession("This account is not an admin.");
        setAuthError("This account is not an admin.");
        return;
      }
      setAdminInfo(data);
    } catch (err) {
      handleRequestError(err, setAuthError, "Unable to load admin profile.");
    }
  };

  const loadDashboardStats = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingDashboard(true);
    setDashboardError("");
    try {
      const data = await getAdminDashboard(authToken);
      setDashboardStats(data);
    } catch (err) {
      handleRequestError(err, setDashboardError, "Unable to load dashboard stats.");
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const loadUsers = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingUsers(true);
    setUsersError("");
    try {
      const data = await getAdminUsers(authToken);
      setUsers(data?.users || []);
    } catch (err) {
      handleRequestError(err, setUsersError, "Unable to load users.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadVendors = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingVendors(true);
    setVendorsError("");
    try {
      const data = await getAdminVendors(authToken);
      setVendors(data?.vendors || []);
    } catch (err) {
      handleRequestError(err, setVendorsError, "Unable to load vendors.");
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const loadBrands = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingBrands(true);
    setBrandsError("");
    try {
      const data = await getAdminBrands(authToken);
      const items = Array.isArray(data) ? data : data?.items || [];
      setBrands(items);
    } catch (err) {
      handleRequestError(err, setBrandsError, "Unable to load brands.");
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const loadCampaignAnalytics = async (authToken = token, campaignId = campaignAnalyticsId) => {
    if (!authToken || !campaignId) return;
    setIsLoadingCampaignAnalytics(true);
    setCampaignAnalyticsError("");
    try {
      const data = await getAdminCampaignAnalytics(authToken, campaignId);
      setCampaignAnalytics(data);
      setCampaignEditStatus("");
      setCampaignEditError("");
      setCampaignEditForm({
        id: data?.campaign?.id || campaignId,
        title: data?.campaign?.title || "",
        description: data?.campaign?.description || "",
        cashbackAmount: data?.campaign?.cashbackAmount ?? "",
        startDate: formatDateInput(data?.campaign?.startDate),
        endDate: formatDateInput(data?.campaign?.endDate),
        totalBudget: data?.campaign?.totalBudget ?? "",
        subtotal: data?.campaign?.subtotal ?? "",
      });
    } catch (err) {
      handleRequestError(err, setCampaignAnalyticsError, "Unable to load campaign analytics.");
    } finally {
      setIsLoadingCampaignAnalytics(false);
    }
  };

  const loadCampaigns = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingCampaigns(true);
    setCampaignsError("");
    try {
      const data = await getAdminCampaigns(authToken, "vendor");
      const items = Array.isArray(data) ? data : data?.items || [];
      setCampaigns(items);
    } catch (err) {
      handleRequestError(err, setCampaignsError, "Unable to load campaigns.");
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadOrders = async (authToken = token, { page = 1, append = false } = {}) => {
    if (!authToken) return;
    setIsLoadingOrders(true);
    setOrdersError("");
    const limit = 20;
    try {
      const data = await getAdminOrders(authToken, { page, limit });
      const items = Array.isArray(data) ? data : data?.items || data?.orders || data?.data || [];
      const total = Number.isFinite(data?.total) ? data.total : items.length;
      const statusCounts = data?.statusCounts || {};

      setOrders((prev) => {
        const updated = append ? [...prev, ...items] : items;
        setOrdersHasMore(updated.length < total);
        return updated;
      });
      setOrdersTotal(total);
      setOrdersPage(page);
      setOrderStatusSummary(statusCounts);
    } catch (err) {
      handleRequestError(err, setOrdersError, "Unable to load orders.");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadTransactions = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingTransactions(true);
    setTransactionsError("");
    try {
      const data = await getAdminTransactions(authToken);
      setTransactions(data?.transactions || []);
    } catch (err) {
      handleRequestError(err, setTransactionsError, "Unable to load transactions.");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadQrs = async (authToken = token, { page = 1, append = false } = {}) => {
    if (!authToken) return;
    setIsLoadingQrs(true);
    setQrsError("");
    const limit = 150;
    try {
      const data = await getAdminQrs(authToken, { page, limit });
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];
      const total = Number.isFinite(data?.total) ? data.total : items.length;
      const statusCounts = data?.statusCounts || {};

      setQrs((prev) => {
        const updated = append ? [...prev, ...items] : items;
        setQrsHasMore(updated.length < total);
        return updated;
      });
      setQrsTotal(total);
      setQrsPage(page);
      setQrStatusSummary(statusCounts);
    } catch (err) {
      handleRequestError(err, setQrsError, "Unable to load QR codes.");
    } finally {
      setIsLoadingQrs(false);
    }
  };

  const loadWithdrawals = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingWithdrawals(true);
    setWithdrawalsError("");
    try {
      const data = await getAdminWithdrawals(authToken);
      setWithdrawals(data || []);
    } catch (err) {
      handleRequestError(err, setWithdrawalsError, "Unable to load withdrawals.");
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const loadNotifications = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingNotifications(true);
    setNotificationsError("");
    try {
      const data = await getAdminNotifications(authToken);
      const items = Array.isArray(data) ? data : data?.items || [];
      setNotifications(items);
    } catch (err) {
      if (err?.status === 404) {
        setNotifications([]);
      } else {
        handleRequestError(err, setNotificationsError, "Unable to load notifications.");
      }
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const loadSubscriptions = async (authToken = token, statusFilter = subscriptionFilter) => {
    if (!authToken) return;
    setIsLoadingSubscriptions(true);
    setSubscriptionsError("");
    const normalizedStatus =
      statusFilter && statusFilter !== "all" ? statusFilter.toUpperCase() : undefined;
    try {
      const data = await getAdminSubscriptions(authToken, normalizedStatus);
      setSubscriptions(data || []);
    } catch (err) {
      handleRequestError(err, setSubscriptionsError, "Unable to load subscriptions.");
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const loadAll = async (authToken = token) => {
    if (!authToken) return;
    setIsRefreshing(true);
    await Promise.all([
      loadDashboardStats(authToken),
      loadUsers(authToken),
      loadVendors(authToken),
      loadBrands(authToken),
      loadCampaigns(authToken),
      loadOrders(authToken),
      loadTransactions(authToken),
      loadQrs(authToken),
      loadWithdrawals(authToken),
      loadNotifications(authToken),
      loadSubscriptions(authToken, subscriptionFilter),
    ]);
    setIsRefreshing(false);
  };

  const loadSectionData = async (authToken = token) => {
    if (!authToken) return;
    setIsRefreshing(true);
    const tasks = [];

    if (isOverviewRoute) {
      tasks.push(
        loadDashboardStats(authToken),
        loadUsers(authToken),
        loadVendors(authToken),
        loadBrands(authToken),
        loadOrders(authToken),
        loadTransactions(authToken),
        loadQrs(authToken),
        loadWithdrawals(authToken),
        loadNotifications(authToken)
      );
    } else if (isAnalyticsRoute) {
      tasks.push(
        loadDashboardStats(authToken),
        loadTransactions(authToken),
        loadQrs(authToken),
        loadUsers(authToken)
      );
    } else if (isOperationsRoute) {
      tasks.push(loadVendors(authToken), loadBrands(authToken));
    } else if (isCampaignsRoute) {
      tasks.push(loadCampaigns(authToken));
    } else if (isOrdersRoute) {
      tasks.push(loadOrders(authToken), loadQrs(authToken));
    } else if (isPayoutsRoute) {
      tasks.push(loadWithdrawals(authToken), loadTransactions(authToken));
    } else if (isUsersRoute) {
      tasks.push(loadUsers(authToken));
    } else if (isVendorsRoute || isSubscriptionsRoute) {
      tasks.push(loadVendors(authToken), loadBrands(authToken), loadSubscriptions(authToken, subscriptionFilter));
    } else if (isTransactionsRoute) {
      tasks.push(loadTransactions(authToken));
    } else if (isQrsRoute) {
      tasks.push(loadQrs(authToken));
    }

    if (tasks.length) {
      await Promise.all(tasks);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!token) return;
    loadAdmin(token);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadSectionData(token);
  }, [token, activeSection, activeSubSection]);

  useEffect(() => {
    if (!token) return;
    if (!isSubscriptionsRoute && !isVendorsRoute) return;
    loadSubscriptions(token, subscriptionFilter);
  }, [token, subscriptionFilter, isSubscriptionsRoute, isVendorsRoute]);





  useEffect(() => {
    if (!token || !campaignAnalyticsId) return;
    loadCampaignAnalytics(token, campaignAnalyticsId);
  }, [token, campaignAnalyticsId]);

  useEffect(() => {
    if (campaignAnalyticsId) return;
    setCampaignAnalytics(null);
  }, [campaignAnalyticsId]);

  useEffect(() => {
    localStorage.setItem(
      ADMIN_SIDEBAR_KEY,
      sidebarCollapsed ? "collapsed" : "expanded"
    );
  }, [sidebarCollapsed]);

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
      if (data.role !== "admin") {
        throw new Error("This account is not an admin.");
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setAdminInfo({ name: data.name, email: data.email, role: data.role });
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
    setUsers([]);
    setVendors([]);
    setCampaigns([]);
    setOrders([]);
    setTransactions([]);
    setQrs([]);
    setWithdrawals([]);
    setOrdersTotal(0);
    setOrdersPage(1);
    setOrderStatusSummary({});
    setOrdersHasMore(false);
    setQrsTotal(0);
    setQrsPage(1);
    setQrStatusSummary({});
    setQrsHasMore(false);
  };

  const handleUserStatusSave = async (userId, currentStatus) => {
    const nextStatus = userStatusUpdates[userId] || currentStatus;
    if (!nextStatus) return;
    setUserActionStatus("");
    setUserActionError("");
    try {
      await updateAdminUserStatus(token, userId, nextStatus);
      setUserActionStatus("User status updated.");
      await loadUsers(token);
    } catch (err) {
      handleRequestError(err, setUserActionError, "Unable to update user status.");
    }
  };

  const handleVendorStatusSave = async (vendorId, currentStatus) => {
    const nextStatus = vendorStatusUpdates[vendorId] || currentStatus;
    if (!nextStatus) return;
    setVendorActionStatus("");
    setVendorActionError("");
    try {
      await updateAdminVendorStatus(token, vendorId, nextStatus);
      setVendorActionStatus("Vendor status updated.");
      await loadVendors(token);
    } catch (err) {
      handleRequestError(err, setVendorActionError, "Unable to update vendor status.");
    }
  };

  const handleBrandFormChange = (field) => (event) => {
    setBrandForm((prev) => ({ ...prev, [field]: event.target.value }));
    setBrandCreationError("");
    setBrandCreationMessage("");
    setCreatedBrandCredentials(null);
    setCreatedBrandDetails(null);
    if (field === "logoUrl") {
      setBrandLogoUploadStatus("");
      setBrandLogoUploadError("");
    }
  };

  const handleBrandLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!token) {
      setBrandLogoUploadError("Please sign in first.");
      return;
    }
    setBrandLogoUploadStatus("");
    setBrandLogoUploadError("");
    setIsUploadingBrandLogo(true);
    try {
      const data = await uploadImage(token, file);
      const uploadedUrl = data?.url;
      if (!uploadedUrl) {
        throw new Error("Upload failed. No URL returned.");
      }
      setBrandForm((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      setBrandLogoUploadStatus("Logo uploaded.");
    } catch (err) {
      setBrandLogoUploadError(err.message || "Failed to upload logo.");
    } finally {
      setIsUploadingBrandLogo(false);
      event.target.value = "";
    }
  };

  const handleCreateBrand = async () => {
    if (!brandForm.brandName.trim()) {
      setBrandCreationError("Brand name is required.");
      return;
    }
    if (!brandForm.subscriptionDuration) {
      setBrandCreationError("Select a subscription duration.");
      return;
    }
    const priceValue = brandForm.qrPricePerUnit === "" ? null : Number(brandForm.qrPricePerUnit);
    if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue <= 0 || priceValue > MAX_QR_PRICE)) {
      setBrandCreationError(`QR price per unit must be between 0.01 and ${MAX_QR_PRICE}.`);
      return;
    }

    setIsCreatingBrand(true);
    setBrandCreationError("");
    setBrandCreationMessage("");
    setCreatedBrandCredentials(null);
    setCreatedBrandDetails(null);

    try {
      const payload = {
        name: brandForm.brandName.trim(),
        logoUrl: brandForm.logoUrl.trim() || undefined,
        website: brandForm.website.trim() || undefined,
        subscriptionType: brandForm.subscriptionDuration,
        vendorEmail: brandForm.vendorEmail.trim() || undefined,
        vendorPhone: brandForm.vendorPhone.trim() || undefined,
        qrPricePerUnit: priceValue ?? undefined,
      };

      const data = await createAdminBrand(token, payload);
      setBrandCreationMessage("Brand created and vendor credentials generated.");
      setCreatedBrandCredentials(data?.credentials || null);
      setCreatedBrandDetails({
        brand: data?.brand,
        vendor: data?.vendor,
        subscription: data?.subscription,
      });
      setBrandForm(getDefaultBrandFormState());
      setBrandLogoUploadStatus("");
      setBrandLogoUploadError("");
      await loadVendors(token);
      await loadSubscriptions(token, subscriptionFilter);
    } catch (err) {
      const errorMessage = err?.data?.error || err?.message || "Unable to create brand.";
      setBrandCreationError(errorMessage);
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleSubscriptionFormChange = (field) => (event) => {
    setSubscriptionForm((prev) => ({ ...prev, [field]: event.target.value }));
    setSubscriptionMessage("");
    setSubscriptionError("");
  };

  const handleSubscriptionAction = async () => {
    if (!subscriptionForm.vendorId) {
      setSubscriptionError("Select a vendor to update.");
      return;
    }

    const payload = {};
    switch (subscriptionForm.action) {
      case "renew":
        payload.subscriptionType = subscriptionForm.subscriptionType;
        payload.status = "ACTIVE";
        break;
      case "extend": {
        const months = Number(subscriptionForm.extendMonths);
        if (!Number.isFinite(months) || months <= 0) {
          setSubscriptionError("Enter a valid number of months to extend.");
          return;
        }
        payload.extendMonths = months;
        break;
      }
      case "activate":
        payload.status = "ACTIVE";
        break;
      case "pause":
        payload.status = "PAUSED";
        break;
      case "expire":
        payload.status = "EXPIRED";
        break;
      default:
        break;
    }

    setIsUpdatingSubscription(true);
    setSubscriptionMessage("");
    setSubscriptionError("");
    try {
      await updateAdminVendorSubscription(token, subscriptionForm.vendorId, payload);
      setSubscriptionMessage("Subscription updated successfully.");
      setSubscriptionForm((prev) => ({ ...prev, extendMonths: "" }));
      await loadVendors(token);
      await loadSubscriptions(token, subscriptionFilter);
    } catch (err) {
      setSubscriptionError(err.message || "Unable to update subscription.");
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleWalletCredit = async () => {
    if (!walletCredit.vendorId.trim() || !walletCredit.amount) {
      setWalletError("Vendor ID and amount are required.");
      return;
    }
    if (!walletCredit.description.trim()) {
      setWalletError("Please add a justification for this adjustment.");
      return;
    }
    setWalletError("");
    setWalletStatus("");
    setIsCreditingWallet(true);
    try {
      await adjustVendorWalletAdmin(token, {
        vendorId: walletCredit.vendorId.trim(),
        amount: Number(walletCredit.amount),
        description: walletCredit.description.trim(),
        type: walletCredit.type,
      });
      setWalletStatus(
        walletCredit.type === "debit" ? "Wallet debited successfully." : "Wallet credited successfully."
      );
      setWalletCredit({ vendorId: "", amount: "", description: "", type: "credit" });
      await loadTransactions(token);
    } catch (err) {
      handleRequestError(err, setWalletError, "Unable to adjust vendor wallet.");
    } finally {
      setIsCreditingWallet(false);
    }
  };

  const handleCampaignStatusUpdate = async () => {
    if (!campaignControl.id.trim()) {
      setCampaignError("Campaign ID is required.");
      return;
    }
    setCampaignError("");
    setCampaignStatus("");
    setIsUpdatingCampaign(true);
    try {
      await updateAdminCampaignStatus(token, campaignControl.id.trim(), campaignControl.status);
      setCampaignStatus("Campaign status updated.");
      setCampaignControl((prev) => ({ ...prev, id: "" }));
      await loadCampaigns(token);
    } catch (err) {
      handleRequestError(err, setCampaignError, "Unable to update campaign status.");
    } finally {
      setIsUpdatingCampaign(false);
    }
  };

  const handleVendorDetailsSave = async () => {
    if (!vendorEditForm.vendorId) {
      setVendorEditError("Select a vendor to update.");
      return;
    }
    setVendorEditError("");
    setVendorEditStatus("");
    setIsUpdatingVendorDetails(true);
    try {
      await updateAdminVendorDetails(token, vendorEditForm.vendorId, {
        businessName: vendorEditForm.businessName,
        contactPhone: vendorEditForm.contactPhone,
        contactEmail: vendorEditForm.contactEmail,
        gstin: vendorEditForm.gstin,
        address: vendorEditForm.address,
      });
      setVendorEditStatus("Vendor profile updated.");
      await loadVendorOverview(token, vendorEditForm.vendorId);
      await loadVendors(token);
    } catch (err) {
      handleRequestError(err, setVendorEditError, "Unable to update vendor profile.");
    } finally {
      setIsUpdatingVendorDetails(false);
    }
  };

  const handleBrandDetailsSave = async () => {
    if (!brandEditForm.brandId) {
      setBrandEditError("Select a brand to update.");
      return;
    }
    setBrandEditError("");
    setBrandEditStatus("");
    setIsUpdatingBrandDetails(true);
    try {
      await updateAdminBrandDetails(token, brandEditForm.brandId, {
        name: brandEditForm.name,
        logoUrl: brandEditForm.logoUrl,
        website: brandEditForm.website,
      });
      setBrandEditStatus("Brand details updated.");
      await loadBrandOverview(token, brandEditForm.brandId);
      await loadBrands(token);
      await loadVendors(token);
    } catch (err) {
      handleRequestError(err, setBrandEditError, "Unable to update brand details.");
    } finally {
      setIsUpdatingBrandDetails(false);
    }
  };

  const handleBrandStatusSave = async () => {
    if (!brandStatusUpdate.brandId) {
      setBrandStatusError("Select a brand to update status.");
      return;
    }
    setBrandStatusError("");
    setBrandStatusMessage("");
    setIsUpdatingBrandStatus(true);
    try {
      await updateAdminBrandStatus(token, brandStatusUpdate.brandId, {
        status: brandStatusUpdate.status,
        reason: brandStatusUpdate.reason || undefined,
      });
      setBrandStatusMessage("Brand status updated.");
      await loadBrandOverview(token, brandStatusUpdate.brandId);
      await loadBrands(token);
      await loadVendors(token);
    } catch (err) {
      handleRequestError(err, setBrandStatusError, "Unable to update brand status.");
    } finally {
      setIsUpdatingBrandStatus(false);
    }
  };

  const handleCampaignDetailsSave = async () => {
    if (!campaignEditForm.id) {
      setCampaignEditError("Select a campaign to update.");
      return;
    }
    setCampaignEditError("");
    setCampaignEditStatus("");
    setIsUpdatingCampaignDetails(true);
    try {
      const payload = {};
      if (campaignEditForm.title) payload.title = campaignEditForm.title;
      if (campaignEditForm.description) payload.description = campaignEditForm.description;
      if (campaignEditForm.cashbackAmount !== "") {
        payload.cashbackAmount = Number(campaignEditForm.cashbackAmount);
      }
      if (campaignEditForm.startDate) payload.startDate = campaignEditForm.startDate;
      if (campaignEditForm.endDate) payload.endDate = campaignEditForm.endDate;
      if (campaignEditForm.totalBudget !== "") {
        payload.totalBudget = Number(campaignEditForm.totalBudget);
      }
      if (campaignEditForm.subtotal !== "") {
        payload.subtotal = Number(campaignEditForm.subtotal);
      }
      await updateAdminCampaignDetails(token, campaignEditForm.id, payload);
      setCampaignEditStatus("Campaign details updated.");
      await loadCampaignAnalytics(token, campaignEditForm.id);
      await loadCampaigns(token);
    } catch (err) {
      handleRequestError(err, setCampaignEditError, "Unable to update campaign details.");
    } finally {
      setIsUpdatingCampaignDetails(false);
    }
  };

  const handleAccountView = (account) => {
    if (!account) return;

    const isSameVendor = account.vendorId && account.vendorId === selectedVendorId;
    const isSameBrand = account.brandId && account.brandId === selectedBrandId;
    const isSameAccount = isSameVendor || isSameBrand; // Simplify check

    if (isAccountModalOpen && isSameAccount && account.vendorId === selectedVendorId && account.brandId === selectedBrandId) {
      setIsAccountModalOpen(false);
      return;
    }

    if (account.vendorId || account.brandId) {
      setSelectedVendorId(account.vendorId || "");
      setSelectedBrandId(account.brandId || "");
      setIsAccountModalOpen(true);
    }
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
  };

  useEffect(() => {
    if (!isAccountModalOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAccountModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAccountModalOpen]);

  const handleDownloadOrderPdf = async (order) => {
    if (!order || !order.id) return;
    try {
      setIsPreparingBatchPdf(true);
      setQrBatchStatus("Fetching QRs...");

      // Fetch QRs for this specific order
      const data = await getAdminQrBatch(token, { orderId: order.id });
      const qrsToPrint = Array.isArray(data) ? data : data?.items || data?.qrs || [];

      if (!qrsToPrint.length) {
        setQrBatchError("No QRs found for this order.");
        setIsPreparingBatchPdf(false);
        return;
      }
      setBatchQrs(qrsToPrint);
      setQrBatchStatus(`Generating PDF for ${qrsToPrint.length} QRs...`);

      // Allow DOM to render hidden canvases
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const cols = 2; // 2 columns
      const rows = 4; // 4 rows per page
      const boxWidth = 90;
      const boxHeight = 60;
      const xGap = (pageWidth - cols * boxWidth) / 3;
      const yGap = (pageHeight - rows * boxHeight) / 5;
      const perQrPrice = order.quantity ? Number(order.printCost || 0) / order.quantity : 0;
      const perQrLabel = Number.isFinite(perQrPrice) && perQrPrice > 0 ? formatAmount(perQrPrice) : "0.00";
      const printCostLabel = formatAmount(order.printCost || 0);
      const headerOffset = 36;

      // Draw Header for context
      doc.setFontSize(16);
      doc.text(`QR Batch: ${order.campaignTitle || "Campaign"}`, pageWidth / 2, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Order ID: ${order.id} | Qty: ${order.quantity}`, pageWidth / 2, 22, { align: "center" });
      doc.text(`QR price: INR ${perQrLabel}/QR | Print cost: INR ${printCostLabel}`, pageWidth / 2, 28, {
        align: "center",
      });

      // Loop and draw QRs
      for (let i = 0; i < qrsToPrint.length; i++) {
        const qr = qrsToPrint[i];
        const canvasId = `pdf-qr-${qr.uniqueHash}`;
        const canvas = document.getElementById(canvasId);

        if (canvas) {
          const imgData = canvas.toDataURL("image/png");
          const col = i % cols;
          const row = Math.floor(i / cols) % rows;

          // Add new page if needed
          if (i > 0 && i % (cols * rows) === 0) {
            doc.addPage();
          }

          const x = xGap + col * (boxWidth + xGap);
          const y = headerOffset + yGap + row * (boxHeight + yGap); // Offset for header

          // Card Border
          doc.setDrawColor(200, 200, 200);
          doc.rect(x, y, boxWidth, boxHeight, "S");

          // QR Image
          doc.addImage(imgData, "PNG", x + 5, y + 5, 50, 50);

          // Text details next to QR
          doc.setFontSize(9);
          doc.text("Scan to Claim", x + 60, y + 15);
          doc.setFontSize(12);
          doc.setTextColor(0, 128, 0); // Green
          doc.text(`INR ${qr.cashbackAmount}`, x + 60, y + 25);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          doc.text(qr.uniqueHash ? qr.uniqueHash.slice(0, 8) : "", x + 60, y + 35);
          doc.text("Powered by Incentify", x + 60, y + 50);
        } else {
          console.warn(`Canvas not found for QR ${qr.uniqueHash}`);
        }
      }

      doc.save(`Order_${order.id}_QRs.pdf`);
      setQrBatchStatus("Done!");
    } catch (err) {
      console.error("PDF Gen Error:", err);
      setQrBatchError("Failed to generate PDF");
    } finally {
      setIsPreparingBatchPdf(false);
      setBatchQrs([]);
    }
  };



  const renderOrderActions = (order) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleDownloadOrderPdf(order)}
        disabled={isPreparingBatchPdf}
        className="p-1.5 rounded-lg text-slate-500 hover:text-[#81cc2a] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        title="Download QR PDF"
      >
        <Download size={16} />
      </button>
      {order.status === 'paid' && (
        <button
          onClick={() => handleOrderStatusSave(order.id, 'shipped')}
          className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 font-semibold"
        >
          Mark Shipped
        </button>
      )}
    </div>
  );



  const attentionRequests = useMemo(() => {
    const items = [];

    if (Array.isArray(withdrawals)) {
      withdrawals
        .filter((withdrawal) => String(withdrawal?.status || "").toLowerCase() === "pending")
        .forEach((withdrawal) => {
          const vendorLabel =
            withdrawal?.Wallet?.Vendor?.businessName ||
            withdrawal?.Wallet?.User?.name ||
            withdrawal?.Wallet?.User?.email ||
            "Vendor";
          const createdAtValue = withdrawal?.createdAt
            ? new Date(withdrawal.createdAt).getTime()
            : 0;
          const amountLabel =
            withdrawal?.amount !== undefined && withdrawal?.amount !== null
              ? `INR ${formatAmount(withdrawal.amount)}`
              : null;

          items.push({
            id: withdrawal.id,
            type: "withdrawal",
            title: `Withdrawal request #${String(withdrawal?.id || "").slice(-6)}`,
            subtitle: vendorLabel,
            meta: "Pending payout",
            amountLabel,
            status: withdrawal?.status,
            date: formatDate(withdrawal?.createdAt),
            createdAt: createdAtValue,
          });
        });
    }

    if (Array.isArray(orders)) {
      orders
        .filter((order) => QR_ORDER_ATTENTION_STATUSES.includes(String(order?.status || "").toLowerCase()))
        .forEach((order) => {
          const vendorLabel =
            order?.vendor?.businessName ||
            order?.vendor?.brandName ||
            order?.vendor?.email ||
            "Vendor";
          const campaignTitle = order?.campaignTitle || "Campaign";
          const createdAtValue = order?.createdAt
            ? new Date(order.createdAt).getTime()
            : 0;
          const amountLabel =
            order?.totalAmount !== undefined && order?.totalAmount !== null
              ? `INR ${formatAmount(order.totalAmount)}`
              : null;
          const normalizedStatus = String(order?.status || "pending").toLowerCase();
          const statusTag = normalizedStatus === "paid" ? "approved" : normalizedStatus;
          const statusLabel =
            normalizedStatus === "paid"
              ? "Approved"
              : normalizedStatus === "pending"
                ? "Pending"
                : order?.status;

          items.push({
            id: order.id,
            type: "order",
            title: `QR order #${String(order?.id || "").slice(-6)}`,
            subtitle: vendorLabel,
            meta: `Campaign: ${campaignTitle} | Qty: ${order?.quantity ?? 0}`,
            amountLabel,
            status: statusTag,
            statusLabel,
            date: formatDate(order?.createdAt),
            createdAt: createdAtValue,
          });
        });
    }

    return items;
  }, [orders, withdrawals]);

  const notificationActivities = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    return notifications.map((notification) => {
      const metadata = notification.metadata || {};
      const isAdminOrder = notification.type === "admin-order";
      const vendorLabel = metadata.vendorLabel || metadata.vendorName || null;
      const campaignLabel = metadata.campaignTitle || null;
      const quantityLabel =
        metadata.quantity !== undefined && metadata.quantity !== null
          ? `Qty: ${metadata.quantity}`
          : null;
      const statusLabel = metadata.status || (notification.isRead ? "read" : "unread");
      const metaParts = [];
      if (campaignLabel) metaParts.push(`Campaign: ${campaignLabel}`);
      if (quantityLabel) metaParts.push(quantityLabel);
      if (metadata.requestedUsername) {
        metaParts.push(`Username: ${metadata.requestedUsername}`);
      }
      if (
        metadata.status &&
        (!campaignLabel || campaignLabel.toLowerCase() !== metadata.status.toLowerCase())
      ) {
        metaParts.push(`Status: ${metadata.status}`);
      }
      const metaText =
        metaParts.length > 0 ? metaParts.join(" | ") : notification.type ? `Type: ${notification.type}` : "Notification";
      const amountLabel =
        metadata.totalAmount !== undefined && metadata.totalAmount !== null
          ? `INR ${formatAmount(metadata.totalAmount)}`
          : null;

      const defaultTitle = isAdminOrder
        ? `QR order ${metadata.orderId ? `#${String(metadata.orderId).slice(-6)}` : "paid"}`
        : "Notification";

      return {
        id: notification.id,
        type: isAdminOrder ? "order" : "notification",
        title: notification.title || defaultTitle,
        subtitle: vendorLabel || notification.message,
        meta: metaText,
        amountLabel,
        status: statusLabel,
        date: formatDate(notification.createdAt),
        createdAt: notification.createdAt ? new Date(notification.createdAt).getTime() : 0,
        payload: metadata,
      };
    });
  }, [notifications]);

  const vendorNotificationActivities = useMemo(() => {
    const combined = [...attentionRequests, ...notificationActivities];
    return combined
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6);
  }, [attentionRequests, notificationActivities]);

  const pendingWithdrawalsInFlight = withdrawals?.filter(
    (withdrawal) => String(withdrawal?.status || "").toLowerCase() === "pending"
  )?.length || 0;
  const pendingWithdrawalCount = pendingWithdrawalsInFlight || dashboardStats?.pendingWithdrawals || 0;
  const ordersAwaitingAction = orders?.filter((order) =>
    QR_ORDER_ATTENTION_STATUSES.includes(String(order?.status || "").toLowerCase())
  )?.length || 0;
  const orderAttentionCount = ordersAwaitingAction || dashboardStats?.ordersAttention || 0;

  // Count pending QR orders (paid but not shipped)
  const pendingQrOrders = orders?.filter((order) =>
    ['paid', 'pending'].includes(String(order?.status || "").toLowerCase())
  )?.length || 0;
  const pendingQrOrderCount = pendingQrOrders || dashboardStats?.ordersAttention || 0;

  const totalQrsCount = dashboardStats?.totalQrs || 0;

  const effectiveUserStatusCounts = dashboardStats?.userStatusCounts || { active: users?.filter(u => u.status === 'active')?.length || 0 };
  const effectiveVendorStatusCounts = dashboardStats?.vendorStatusCounts || { active: vendors?.filter(v => v.status === 'active')?.length || 0 };
  const totalBalance = dashboardStats?.totalWalletBalance || 0;

  const notificationCount = pendingWithdrawalCount + orderAttentionCount;

  const handleCampaignRowStatusSave = async (campaignId, currentStatus) => {
    if (!campaignId) return;
    const normalizedCurrent = String(currentStatus || "").toLowerCase();
    const nextStatus = String(campaignStatusUpdates[campaignId] || normalizedCurrent).toLowerCase();
    const allowedStatuses = ["active", "paused", "rejected", "completed"];

    setCampaignActionStatus("");
    setCampaignActionError("");

    if (!allowedStatuses.includes(nextStatus)) {
      setCampaignActionError("Select a valid status to update.");
      return;
    }
    if (nextStatus === normalizedCurrent) {
      return;
    }

    try {
      await updateAdminCampaignStatus(token, campaignId, nextStatus);
      setCampaignActionStatus("Campaign status updated.");
      setCampaignStatusUpdates((prev) => {
        const updated = { ...prev };
        delete updated[campaignId];
        return updated;
      });
      await loadCampaigns(token);
    } catch (err) {
      handleRequestError(err, setCampaignActionError, "Unable to update campaign status.");
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!campaign?.id) return;
    const name = campaign.title || "this campaign";
    if (!window.confirm(`Delete ${name}? This removes all QRs for this campaign.`)) {
      return;
    }

    setCampaignActionStatus("");
    setCampaignActionError("");
    setDeletingCampaignId(campaign.id);

    try {
      await deleteAdminCampaign(token, campaign.id);
      setCampaignActionStatus("Campaign deleted.");
      setCampaigns((prev) => prev.filter((item) => item.id !== campaign.id));
      setCampaignStatusUpdates((prev) => {
        if (!prev[campaign.id]) return prev;
        const updated = { ...prev };
        delete updated[campaign.id];
        return updated;
      });
    } catch (err) {
      handleRequestError(err, setCampaignActionError, "Unable to delete campaign.");
    } finally {
      setDeletingCampaignId(null);
    }
  };

  const handleOrderStatusSave = async (orderId, currentStatus) => {
    if (!orderId) return;
    const normalizedCurrent = String(currentStatus || "").toLowerCase();
    const nextStatus = String(orderStatusUpdates[orderId] || normalizedCurrent).toLowerCase();
    const allowedStatuses = ["pending", "paid", "shipped"];

    setOrderActionStatus("");
    setOrderActionError("");

    if (!allowedStatuses.includes(nextStatus)) {
      setOrderActionError("Select a valid order status.");
      return;
    }
    if (nextStatus === normalizedCurrent) {
      return;
    }

    try {
      await updateAdminOrderStatus(token, orderId, nextStatus);
      setOrderActionStatus("Order status updated.");
      setOrderStatusUpdates((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      await loadOrders(token);
    } catch (err) {
      handleRequestError(err, setOrderActionError, "Unable to update order status.");
    }
  };

  const handleWithdrawalProcess = async () => {
    if (!withdrawalAction.id.trim()) {
      setWithdrawalError("Withdrawal ID is required.");
      return;
    }
    setWithdrawalError("");
    setWithdrawalStatus("");
    try {
      await processAdminWithdrawal(token, withdrawalAction.id.trim(), {
        status: withdrawalAction.status,
        referenceId: withdrawalAction.referenceId.trim() || undefined,
        adminNote: withdrawalAction.adminNote.trim() || undefined,
      });
      setWithdrawalStatus("Withdrawal updated.");
      setWithdrawalAction({ id: "", status: "processed", referenceId: "", adminNote: "" });
      await loadWithdrawals(token);
      await loadTransactions(token);
    } catch (err) {
      handleRequestError(err, setWithdrawalError, "Unable to process withdrawal.");
    }
  };

  const handleDownloadQrBatchPdf = async (batch) => {
    if (isPreparingBatchPdf) return;
    if (!batch?.campaignId) {
      setQrBatchError("Batch information is incomplete.");
      return;
    }

    setQrBatchError("");
    setQrBatchStatus("");
    setIsPreparingBatchPdf(true);

    try {
      const data = await getAdminQrBatch(token, {
        campaignId: batch.campaignId,
        cashbackAmount: batch.cashbackAmount,
        limit: 2000
      });
      const items = Array.isArray(data) ? data : data?.items || [];
      const total = Number.isFinite(data?.total) ? data.total : items.length;

      if (!items.length) {
        setQrBatchError("No QRs available for this batch.");
        return;
      }

      setBatchQrs(items);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const qrSize = 40;
      const margin = 14;
      const itemsPerRow = 4;
      const rowsPerPage = 6;
      const rowSpacing = qrSize + 28;
      const spacing = (pageWidth - margin * 2 - qrSize * itemsPerRow) / Math.max(itemsPerRow - 1, 1);
      const priceLabel = formatAmount(batch.cashbackAmount);
      const campaignTitle = batch.campaignTitle || "Campaign";
      const brandName = batch.brandName || "Brand";
      const vendorLabel = batch.vendorLabel || "Vendor";
      let skipped = 0;

      const drawHeader = () => {
        doc.setFontSize(16);
        doc.text(`QR Batch - INR ${priceLabel}`, margin, 18);
        doc.setFontSize(10);
        doc.text(`Campaign: ${campaignTitle}`, margin, 26);
        doc.text(`Brand: ${brandName}`, margin, 32);
        doc.text(`Vendor: ${vendorLabel}`, margin, 38);
      };

      drawHeader();

      const itemsPerPage = itemsPerRow * rowsPerPage;

      items.forEach((qr, index) => {
        const localIndex = index % itemsPerPage;
        if (index > 0 && localIndex === 0) {
          doc.addPage();
          drawHeader();
        }

        const col = localIndex % itemsPerRow;
        const row = Math.floor(localIndex / itemsPerRow);
        const xPos = margin + col * (qrSize + spacing);
        const yPos = 46 + row * rowSpacing;

        const canvas = document.getElementById(getBatchCanvasId(qr.uniqueHash));
        if (!canvas) {
          skipped += 1;
          return;
        }

        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", xPos, yPos, qrSize, qrSize);

        const perPrice = Number(qr.cashbackAmount) || Number(batch.cashbackAmount) || 0;
        doc.setFontSize(8);
        doc.text(qr.uniqueHash.slice(0, 8), xPos, yPos + qrSize + 6);
        doc.text(`INR ${formatAmount(perPrice)}`, xPos, yPos + qrSize + 12);
      });

      const truncated = total > items.length;
      if (skipped > 0 || truncated) {
        const parts = [];
        if (skipped > 0) parts.push(`${skipped} QR(s) not ready`);
        if (truncated) parts.push(`showing ${items.length} of ${total}`);
        setQrBatchStatus(`Downloaded PDF. ${parts.join(", ")}.`);
      } else {
        setQrBatchStatus("QR batch PDF downloaded.");
      }

      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      doc.save(`qrs-${priceLabel}-${timestamp}.pdf`);
    } catch (err) {
      console.error("PDF Gen Error:", err);
      setQrBatchError("Failed to generate PDF");
    } finally {
      setIsPreparingBatchPdf(false);
      setBatchQrs([]);
    }
  };

  const handleNavClick = (id) => {
    const route = navRouteMap[id] || `/admin/${id}`;
    navigate(route);
    setSidebarOpen(false);
  };
  const handleRequestClick = (request) => {
    if (!request?.type) return;
    if (request.type === "order") {
      const payload = request?.payload || {};
      const orderId = payload.orderId || payload.id;
      if (orderId) {
        const orderFromList = orders.find((order) => order.id === orderId);
        const fallbackOrder = orderFromList || {
          id: orderId,
          campaignTitle: payload.campaignTitle,
          quantity: payload.quantity,
          cashbackAmount: payload.cashbackAmount,
        };
        handleDownloadOrderPdf(fallbackOrder);
      }
      handleNavClick("orders");
      return;
    }
    if (request.type === "withdrawal") {
      handleNavClick("payouts");
      return;
    }
    if (request.type === "notification") {
      const vendorId = request?.payload?.vendorId || "";
      const brandId = request?.payload?.brandId || "";
      if (vendorId || brandId) {
        handleAccountView({ vendorId, brandId });
      }
    }
  };
  const normalizedSearch = searchQuery.trim().toLowerCase();

  if (!token) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#fdfdfd] p-4 text-slate-900 dark:bg-[#020202] dark:text-white transition-colors duration-300 font-admin-body">
        <div className="grid w-full max-w-[1000px] grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-40">
                <img
                  src={effectiveTheme === "dark" ? "/dark theme incentify logo.png" : "/light theme incentify logo.png"}
                  alt="Incentify Online"
                  className="h-full w-full object-contain object-left"
                />
              </div>
              <span className="rounded-full bg-[#e8ff74] px-3 py-1 text-xs font-semibold text-slate-900">
                Admin
              </span>
            </div >
            <div className="mt-8 space-y-4">
              <h1 className="text-3xl font-admin-heading font-semibold text-slate-900">
                Admin command center
              </h1>
              <p className="text-sm text-slate-600">
                Monitor campaigns, wallets, payouts, and live activity with the latest analytics
                studio.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Live alerts", value: "Real-time" },
                { label: "Secure access", value: "Role based" },
                { label: "Automations", value: "Smart routing" },
                { label: "Refresh", value: "Instant" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/20 dark:bg-white/90"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm font-admin-heading text-slate-900">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-slate-900 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/95 dark:shadow-[0_40px_90px_-60px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck size={16} className="text-primary-strong" />
              Admin access
            </div>
            <div className="mt-6 space-y-3">
              <label className="text-xs font-semibold text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@incentify.local"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-strong focus:outline-none"
              />
            </div>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-strong focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="mt-6 w-full rounded-xl bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold py-2 shadow-md transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSigningIn ? "Signing in..." : "Sign in"}
            </button>
            {authStatus && (
              <div className="mt-3 text-xs text-emerald-600 font-semibold">{authStatus}</div>
            )}
            {authError && (
              <div className="mt-3 text-xs text-rose-600 font-semibold">{authError}</div>
            )}
            <div className="mt-6 text-xs text-slate-500">
              Use the seeded admin credentials or create a new admin from the backend.
            </div>
          </div>
        </div >
      </div >

    );
  }

  // --- Filtering & Derived State for Dashboard Views ---
  const searchLower = (searchQuery || "").toLowerCase().trim();

  // Vendors
  const normalizedVendorView = String(vendorView || "all").toLowerCase();
  const vendorStatusFilter = {
    active: ["active"],
    paused: ["paused", "expired", "pending", "rejected"],
  };
  const allowedVendorStatuses = vendorStatusFilter[normalizedVendorView];
  const filteredVendors = (vendors || []).filter(v => {
    if (allowedVendorStatuses) {
      const vendorStatus = String(v?.status || "").toLowerCase();
      if (!allowedVendorStatuses.includes(vendorStatus)) {
        return false;
      }
    }
    if (!searchLower) return true;
    const name = v.businessName?.toLowerCase() || "";
    const email = v.contactEmail?.toLowerCase() || v.User?.email?.toLowerCase() || "";
    return name.includes(searchLower) || email.includes(searchLower);
  });
  const limitedVendors = showAllVendors ? filteredVendors : filteredVendors.slice(0, 8);

  // Users
  const filteredUsers = (users || []).filter(u => {
    if (!searchLower) return true;
    const name = u.name?.toLowerCase() || "";
    const email = u.email?.toLowerCase() || "";
    return name.includes(searchLower) || email.includes(searchLower);
  });
  const limitedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 8);

  const qrsTotalLabel = qrsTotal || qrs.length || 0;
  const qrStatusCounts = useMemo(() => {
    const counts = { active: 0, pending: 0, redeemed: 0, blocked: 0 };
    const summary = qrStatusSummary || {};
    const normalizedEntries = Object.entries(summary);
    if (normalizedEntries.length > 0) {
      normalizedEntries.forEach(([status, value]) => {
        const normalized = (status || "").toLowerCase();
        const amount = Number(value) || 0;
        if (normalized.includes("act")) {
          counts.active += amount;
        } else if (normalized.includes("pend")) {
          counts.pending += amount;
        } else if (normalized.includes("redeem") || normalized.includes("used")) {
          counts.redeemed += amount;
        } else if (normalized.includes("block") || normalized.includes("revoked")) {
          counts.blocked += amount;
        } else {
          counts.active += amount;
        }
      });
      return counts;
    }

    qrs.forEach((qr) => {
      const status = (qr?.status || "active").toLowerCase();
      if (status.includes("pend")) counts.pending += 1;
      else if (status.includes("redeem") || status.includes("used")) counts.redeemed += 1;
      else if (status.includes("block") || status.includes("revoked")) counts.blocked += 1;
      else counts.active += 1;
    });

    return counts;
  }, [qrStatusSummary, qrs]);

  const qrsCoverageLabel = qrsTotal > qrs.length ? `Showing ${qrs.length} of ${qrsTotal}` : "";

  const qrBatchSummary = useMemo(() => {
    if (!qrs?.length) return [];
    const batches = new Map();

    qrs.forEach((qr) => {
      const campaign = qr?.Campaign;
      const brand = campaign?.Brand;
      const vendor = brand?.Vendor;
      const campaignId = qr?.campaignId || campaign?.id || "unknown";
      const cashbackAmount = Number(qr?.cashbackAmount ?? 0);
      const key = `${campaignId}-${Number.isFinite(cashbackAmount) ? cashbackAmount : "na"}`;
      const existing = batches.get(key) || {
        id: key,
        campaignId,
        campaignTitle: campaign?.title || "Campaign",
        brandName: brand?.name || "Brand",
        vendorLabel: vendor?.businessName || vendor?.User?.email || "Vendor",
        cashbackAmount: Number.isFinite(cashbackAmount) ? cashbackAmount : 0,
        total: 0,
        active: 0,
        redeemed: 0,
        lastCreatedAt: null,
      };

      existing.total += 1;
      const status = String(qr?.status || "").toLowerCase();
      if (status.includes("redeem") || status.includes("used")) {
        existing.redeemed += 1;
      } else if (!status.includes("block") && !status.includes("revoked")) {
        existing.active += 1;
      }

      const createdAt = qr?.createdAt ? new Date(qr.createdAt).getTime() : 0;
      if (!existing.lastCreatedAt || createdAt > new Date(existing.lastCreatedAt).getTime()) {
        existing.lastCreatedAt = qr?.createdAt || existing.lastCreatedAt;
      }

      batches.set(key, existing);
    });

    return Array.from(batches.values()).sort((a, b) => {
      const timeA = a.lastCreatedAt ? new Date(a.lastCreatedAt).getTime() : 0;
      const timeB = b.lastCreatedAt ? new Date(b.lastCreatedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [qrs]);

  const qrBatchSearchTerm = qrBatchSearch.trim().toLowerCase();
  const filteredQrBatchSummary = useMemo(() => {
    if (!qrBatchSearchTerm) return qrBatchSummary;
    return qrBatchSummary.filter((batch) => {
      const haystack = `${batch.campaignTitle} ${batch.brandName} ${batch.vendorLabel}`.toLowerCase();
      return haystack.includes(qrBatchSearchTerm);
    });
  }, [qrBatchSummary, qrBatchSearchTerm]);

  const sortedQrBatchSummary = useMemo(() => {
    const items = [...filteredQrBatchSummary];
    const getTime = (value) => (value ? new Date(value).getTime() : 0);
    switch (qrBatchSort) {
      case "qty":
        return items.sort((a, b) => b.total - a.total || getTime(b.lastCreatedAt) - getTime(a.lastCreatedAt));
      case "active":
        return items.sort((a, b) => b.active - a.active || getTime(b.lastCreatedAt) - getTime(a.lastCreatedAt));
      case "cashback":
        return items.sort(
          (a, b) => (b.cashbackAmount || 0) - (a.cashbackAmount || 0) || getTime(b.lastCreatedAt) - getTime(a.lastCreatedAt)
        );
      case "oldest":
        return items.sort((a, b) => getTime(a.lastCreatedAt) - getTime(b.lastCreatedAt));
      default:
        return items.sort((a, b) => getTime(b.lastCreatedAt) - getTime(a.lastCreatedAt));
    }
  }, [filteredQrBatchSummary, qrBatchSort]);

  const qrBatchPreviewLimit = 8;
  const visibleQrBatchSummary = showAllQrBatches
    ? sortedQrBatchSummary
    : sortedQrBatchSummary.slice(0, qrBatchPreviewLimit);
  const qrBatchActiveTotal = sortedQrBatchSummary.reduce((sum, batch) => sum + batch.active, 0);

  const orderStatusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      paid: 0,
      shipped: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
    };
    const summary = orderStatusSummary || {};
    const entries = Object.entries(summary);
    if (entries.length > 0) {
      entries.forEach(([status, value]) => {
        const normalized = (status || "").toLowerCase();
        const amount = Number(value) || 0;
        if (normalized.includes("pend")) counts.pending += amount;
        else if (normalized.includes("paid")) counts.paid += amount;
        else if (normalized.includes("ship")) counts.shipped += amount;
        else if (normalized.includes("complete")) counts.completed += amount;
        else if (normalized.includes("reject")) counts.rejected += amount;
        else if (normalized.includes("cancel")) counts.cancelled += amount;
      });
      return counts;
    }

    orders.forEach((order) => {
      const status = String(order?.status || "pending").toLowerCase();
      if (status.includes("pend")) counts.pending += 1;
      else if (status.includes("paid")) counts.paid += 1;
      else if (status.includes("ship")) counts.shipped += 1;
      else if (status.includes("complete")) counts.completed += 1;
      else if (status.includes("reject")) counts.rejected += 1;
      else if (status.includes("cancel")) counts.cancelled += 1;
    });

    return counts;
  }, [orderStatusSummary, orders]);

  const orderNotificationCount = (orderStatusCounts.pending || 0) + (orderStatusCounts.paid || 0);

  const sortedOrders = useMemo(() => {
    const priority = {
      pending: 0,
      paid: 1,
      processing: 2,
      shipped: 3,
      completed: 4,
      rejected: 5,
      cancelled: 6,
    };
    return [...orders].sort((a, b) => {
      const statusA = String(a?.status || "pending").toLowerCase();
      const statusB = String(b?.status || "pending").toLowerCase();
      const priorityA = priority[statusA] ?? 99;
      const priorityB = priority[statusB] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const dateA = new Date(a?.createdAt || 0).getTime();
      const dateB = new Date(b?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [orders]);

  const campaignStatusCounts = useMemo(() => buildStatusCounts(campaigns || [], "status"), [campaigns]);

  // --- Dashboard Data Filtering ---
  const filteredDashboardData = useMemo(() => {
    let _transactions = transactions || [];
    let _qrs = qrs || [];
    let _orders = sortedOrders || []; // Use sorted orders as base

    // Filter by Brand
    if (filterBrandId !== "all") {
      const bId = filterBrandId;
      _transactions = _transactions.filter(
        t => t.Wallet?.Vendor?.Brand?.id === bId || t.Wallet?.Vendor?.brandId === bId
      );
      _orders = _orders.filter(o => {
        const orderBrandId = o.brandId || o.vendor?.brandId || o.vendor?.Brand?.id;
        return orderBrandId === bId;
      });
      _qrs = _qrs.filter(q => q.Campaign?.Brand?.id === bId || q.Campaign?.brandId === bId);
    }

    // Filter by Vendor
    if (filterVendorId !== "all") {
      const vId = filterVendorId;
      _transactions = _transactions.filter(t => {
        const vid = t.Wallet?.Vendor?.id || t.Wallet?.vendorId;
        return vid === vId;
      });
      _orders = _orders.filter(o => {
        const vid = o.vendorId || o.vendor?.id;
        return vid === vId;
      });
      _qrs = _qrs.filter(q => {
        const vid =
          q.vendorId ||
          q.Campaign?.vendorId ||
          q.Campaign?.Vendor?.id ||
          q.Campaign?.Brand?.Vendor?.id;
        return vid === vId;
      });
    }

    // Filter by Campaign
    if (filterCampaignId !== "all") {
      const cId = filterCampaignId;
      // Transactions: difficult to filter by campaign without explicit link. Skipping tx filter for campaign for now unless category matches?
      // _transactions = _transactions.filter(...) 

      _qrs = _qrs.filter(q => q.campaignId === cId || q.Campaign?.id === cId);
      _orders = _orders.filter(o => o.campaignId === cId || o.Campaign?.id === cId);
    }

    return { transactions: _transactions, qrs: _qrs, orders: _orders };
  }, [transactions, qrs, sortedOrders, filterVendorId, filterCampaignId, filterBrandId]);

  const { transactions: effectiveTransactions, qrs: effectiveQrs, orders: effectiveOrders } = filteredDashboardData;

  // Transactions - filter out admin manual recharges to focus on vendor settlements
  // Now using effectiveTransactions
  const vendorTransactions = (effectiveTransactions || []).filter(tx => {
    const category = String(tx.category || "").toUpperCase();
    return category !== "ADMIN_CREDIT" && category !== "ADMIN_ADJUSTMENT";
  });
  const limitedVendorTransactions = showAllTransactions ? vendorTransactions : vendorTransactions.slice(0, 10);

  // Orders (Server side usually, but slicing for preview)
  const limitedOrders = showAllOrders ? effectiveOrders : effectiveOrders.slice(0, 8);

  // QRs
  const limitedQrs = showAllQrs ? effectiveQrs : effectiveQrs.slice(0, 12);

  // Analytics - Transaction Series (these were missing)
  const transactionSeries = useMemo(() => buildTransactionSeries(effectiveTransactions, analyticsRange), [effectiveTransactions, analyticsRange]);
  const transactionTotals = useMemo(() => ({
    credit: transactionSeries.credit.reduce((sum, val) => sum + val, 0),
    debit: transactionSeries.debit.reduce((sum, val) => sum + val, 0),
  }), [transactionSeries]);

  // Analytics Metric Data (was missing)
  const analyticsMetricData = useMemo(() => {
    if (analyticsMetric === "transactions") {
      return {
        label: "Transaction Volume",
        series: transactionSeries.net,
        value: transactionTotals.credit - transactionTotals.debit,
        isCurrency: true,
      };
    }
    if (analyticsMetric === "users") {
      const userSeries = buildCountSeries(users, analyticsRange, (u) => u.createdAt);
      return {
        label: "New Users",
        series: userSeries.counts,
        value: userSeries.counts.reduce((sum, val) => sum + val, 0),
        isCurrency: false,
      };
    }
    if (analyticsMetric === "qrs") {
      const qrSeries = buildCountSeries(effectiveQrs, analyticsRange, (q) => q.createdAt);
      return {
        label: "QR Codes Generated",
        series: qrSeries.counts,
        value: qrSeries.counts.reduce((sum, val) => sum + val, 0),
        isCurrency: false,
      };
    }
    return { label: "Metric", series: [], value: 0, isCurrency: false };
  }, [analyticsMetric, analyticsRange, transactionSeries, transactionTotals, users, effectiveQrs]);

  // Analytics Stats Cards
  const totalUsersCount = dashboardStats?.users || users.length || 0;
  const displayedVendorsCount = useMemo(() => {
    if (filterVendorId !== "all") return 1;
    if (filterBrandId !== "all") return vendors.filter(v => v.brandId === filterBrandId || v.Brand?.id === filterBrandId).length;
    return vendors.length || 0;
  }, [vendors, filterVendorId, filterBrandId]);

  const displayedQrsCount = effectiveQrs.length || 0;

  const currentDisplayedBalance = useMemo(() => {
    if (filterVendorId !== "all") {
      const v = vendors.find(v => v.id === filterVendorId);
      return v?.Wallet?.balance || 0;
    }
    if (filterBrandId !== "all") {
      return vendors
        .filter(v => v.brandId === filterBrandId || v.Brand?.id === filterBrandId)
        .reduce((sum, v) => sum + (v.Wallet?.balance || 0), 0);
    }
    return vendors.reduce((sum, v) => sum + (v.Wallet?.balance || 0), 0);
  }, [vendors, filterVendorId, filterBrandId]);

  const analyticsStats = [
    { label: "Total Users", value: totalUsersCount, isCurrency: false },
    { label: "Active Vendors", value: displayedVendorsCount, isCurrency: false },
    { label: "Total QRs", value: displayedQrsCount, isCurrency: false },
    { label: "Platform Balance", value: currentDisplayedBalance, isCurrency: true },
  ];



  return (
    <div className="flex min-h-screen w-full bg-slate-100 text-slate-900 dark:bg-[#020202] dark:text-white transition-colors duration-300 font-admin-body">
      {/* New Sidebar */}
      <div className={`hidden lg:block ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} transition-all duration-300`}>
        <AdminSidebar
          collapsed={sidebarCollapsed}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          adminInfo={adminInfo}
          onLogout={handleSignOut}
          orderNotificationCount={orderNotificationCount}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <button
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close sidebar"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar
              collapsed={false}
              activeNav={activeNav}
              onNavClick={(id) => {
                handleNavClick(id);
                setSidebarOpen(false);
              }}
              adminInfo={adminInfo}
              onLogout={handleSignOut}
              orderNotificationCount={orderNotificationCount}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 dark:bg-[#0d0d0e]/80 dark:border-white/5">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-200 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="hidden lg:inline-flex p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-200 transition-colors"
                aria-label="Toggle sidebar collapse"
                title="Toggle sidebar"
              >
                {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{headerTitle}</h1>
                <p className="text-sm text-slate-600 dark:text-white/60">Hi {adminInfo?.name || email || "Admin"}, welcome back!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadAll(token)}
                disabled={isRefreshing}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-200 transition-colors"
                aria-label="Refresh"
              >
                <Search size={20} />
              </button>
              <button
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-200 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#81cc2a] text-[10px] font-semibold text-slate-900 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6 max-w-[1800px] mx-auto">
          {/* Overview Section - Admin Stats */}
          {isOverviewRoute && (
            <section id="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Dashboard Filters */}
              <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm mb-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand</label>
                  <select
                    value={filterBrandId}
                    onChange={(e) => {
                      setFilterBrandId(e.target.value);
                      setFilterVendorId("all");
                      setFilterCampaignId("all");
                    }}
                    className={adminInputClass}
                  >
                    <option value="all">All Brands</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                    {/* Fallback if brands not loaded but present in vendors */}
                    {brands.length === 0 && vendors.map(v => v.Brand).filter((b, i, self) => b && self.findIndex(s => s.id === b.id) === i).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor</label>
                  <select
                    value={filterVendorId}
                    onChange={(e) => {
                      setFilterVendorId(e.target.value);
                      setFilterCampaignId("all");
                    }}
                    className={adminInputClass}
                  >
                    <option value="all">All Vendors</option>
                    {vendors
                      .filter(v => filterBrandId === "all" || v.brandId === filterBrandId || v.Brand?.id === filterBrandId)
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.businessName || v.User?.name || v.contactEmail}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaign</label>
                  <select
                    value={filterCampaignId}
                    onChange={(e) => setFilterCampaignId(e.target.value)}
                    className={adminInputClass}
                  >
                    <option value="all">All Campaigns</option>
                    {campaigns
                      .filter(c => {
                        const matchesVendor = filterVendorId === "all" || c.vendorId === filterVendorId || c.Vendor?.id === filterVendorId;
                        const matchesBrand = filterBrandId === "all" || c.brandId === filterBrandId || c.Brand?.id === filterBrandId;
                        return matchesVendor && matchesBrand;
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.title || "Untitled"}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Platform Balance */}
                <div className={adminCardClass}>
                  <div className={statLabelClass}>Platform Balance</div>
                  <div className="flex items-center justify-between">
                    <span className={statValueClass}>INR {formatAmount(totalBalance)}</span>
                    <Wallet className="text-slate-300 dark:text-white/20" size={24} />
                  </div>
                </div>

                {/* Active Users */}
                <div className={adminCardClass}>
                  <div className={statLabelClass}>Active Users</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-500">{effectiveUserStatusCounts.active || 0}</span>
                    <Users className="text-slate-300 dark:text-white/20" size={24} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Total: {users.length || 0}</div>
                </div>

                {/* Active Vendors */}
                <div className={adminCardClass}>
                  <div className={statLabelClass}>Active Vendors</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-500">{effectiveVendorStatusCounts.active || 0}</span>
                    <Store className="text-slate-300 dark:text-white/20" size={24} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Total: {vendors.length || 0}</div>
                </div>

                {/* Total QRs */}
                <div className={adminCardClass}>
                  <div className={statLabelClass}>Total QR Codes</div>
                  <div className="flex items-center justify-between">
                    <span className={statValueClass}>{totalQrsCount}</span>
                    <QrCode className="text-slate-300 dark:text-white/20" size={24} />
                  </div>
                </div>
              </div>

              {/* Attention Required Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Actions Card */}
                <div className={`${adminCardClass} lg:col-span-2`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="text-[#81cc2a]" size={18} />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Requires Attention</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500 font-medium">Pending Withdrawals</div>
                          <div className="text-xl font-bold text-amber-500 mt-1">{pendingWithdrawalCount}</div>
                        </div>
                        <HandCoins className="text-amber-400/50" size={28} />
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500 font-medium">Orders Awaiting Action</div>
                          <div className="text-xl font-bold text-amber-500 mt-1">{orderAttentionCount}</div>
                        </div>
                        <Package className="text-amber-400/50" size={28} />
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500 font-medium">Pending QR Orders</div>
                          <div className="text-xl font-bold text-amber-500 mt-1">{pendingQrOrderCount}</div>
                        </div>
                        <QrCode className="text-amber-400/50" size={28} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <RecentActivitiesCard
                  title="Vendor Requests & Notifications"
                  activities={vendorNotificationActivities}
                  emptyMessage={isLoadingNotifications ? "Loading notifications..." : "No pending requests."}
                  onItemClick={handleRequestClick}
                />
                {notificationsError && (
                  <div className="text-xs text-rose-400 mt-2">{notificationsError}</div>
                )}
              </div>
            </section>
          )}

          {/* Analytics Section */}
          {isAnalyticsRoute && (
            <section id="analytics" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform performance metrics</p>
                </div>
                <div className="flex gap-2">
                  {rangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAnalyticsRange(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${analyticsRange === option.value
                        ? 'bg-[#81cc2a] text-white shadow-lg shadow-[#81cc2a]/20'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard Filters */}
              <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand</label>
                  <select
                    value={filterBrandId}
                    onChange={(e) => {
                      setFilterBrandId(e.target.value);
                      setFilterVendorId("all");
                      setFilterCampaignId("all");
                    }}
                    className={adminInputClass}
                  >
                    <option value="all">All Brands</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                    {brands.length === 0 && vendors.map(v => v.Brand).filter((b, i, self) => b && self.findIndex(s => s.id === b.id) === i).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor</label>
                  <select
                    value={filterVendorId}
                    onChange={(e) => {
                      setFilterVendorId(e.target.value);
                      setFilterCampaignId("all");
                    }}
                    className={adminInputClass}
                  >
                    <option value="all">All Vendors</option>
                    {vendors
                      .filter(v => filterBrandId === "all" || v.brandId === filterBrandId || v.Brand?.id === filterBrandId)
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.businessName || v.User?.name || v.contactEmail}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaign</label>
                  <select
                    value={filterCampaignId}
                    onChange={(e) => setFilterCampaignId(e.target.value)}
                    className={adminInputClass}
                  >
                    <option value="all">All Campaigns</option>
                    {campaigns
                      .filter(c => {
                        const matchesVendor = filterVendorId === "all" || c.vendorId === filterVendorId || c.Vendor?.id === filterVendorId;
                        const matchesBrand = filterBrandId === "all" || c.brandId === filterBrandId || c.Brand?.id === filterBrandId;
                        return matchesVendor && matchesBrand;
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.title || "Untitled"}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {analyticsStats.map((stat) => (
                  <div key={stat.label} className={adminCardClass}>
                    <div className={statLabelClass}>{stat.label}</div>
                    <div className={statValueClass}>
                      {isLoadingDashboard
                        ? "..."
                        : stat.isCurrency
                          ? `INR ${formatAmount(stat.value)}`
                          : stat.value ?? "-"}
                    </div>
                  </div>
                ))}
              </div>
              {dashboardError && <div className="text-sm text-rose-400">{dashboardError}</div>}

              {/* Transaction Flow Card */}
              <div className={`${adminCardClass} !p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-[#81cc2a]" size={18} />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction Flow</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last {analyticsRange} days</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/5 text-center">
                    <div className="text-xs text-slate-500 font-medium">Credits</div>
                    <div className="text-xl font-bold text-emerald-500 mt-1">INR {formatAmount(transactionTotals.credit)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/5 text-center">
                    <div className="text-xs text-slate-500 font-medium">Debits</div>
                    <div className="text-xl font-bold text-rose-500 mt-1">INR {formatAmount(transactionTotals.debit)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/5 text-center">
                    <div className="text-xs text-slate-500 font-medium">Net Flow</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">INR {formatAmount(transactionTotals.credit - transactionTotals.debit)}</div>
                  </div>
                </div>
                <Sparkline data={transactionSeries.net} />
              </div>
            </section>
          )}

          {/* Operations Section */}
          {isOperationsRoute && (
            <section id="operations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Operations</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manual adjustments and platform controls</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={adminCardClass}>
                  <div className="flex items-center gap-2 mb-6">
                    <Wallet width={18} className="text-[#81cc2a]" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Adjust Vendor Wallet</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vendor ID</label>
                        <input
                          type="text"
                          value={walletCredit.vendorId}
                          onChange={(e) => setWalletCredit({ ...walletCredit, vendorId: e.target.value })}
                          placeholder="e.g. 12345"
                          className={adminInputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Transaction Type</label>
                        <select
                          value={walletCredit.type}
                          onChange={(e) => setWalletCredit({ ...walletCredit, type: e.target.value })}
                          className={adminInputClass}
                        >
                          <option value="credit" className={adminOptionClass}>Credit (Deposit)</option>
                          <option value="debit" className={adminOptionClass}>Debit (Withdraw)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Amount (INR)</label>
                      <input
                        type="number"
                        value={walletCredit.amount}
                        onChange={(e) => setWalletCredit({ ...walletCredit, amount: e.target.value })}
                        placeholder="0.00"
                        className={adminInputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Justification</label>
                      <textarea
                        value={walletCredit.description}
                        onChange={(e) => setWalletCredit({ ...walletCredit, description: e.target.value })}
                        placeholder="Reason for this manual adjustment..."
                        className={`${adminInputClass} min-h-[80px]`}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleWalletCredit}
                        disabled={isCreditingWallet}
                        className={`w-full ${adminPrimaryButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isCreditingWallet ? (
                          <span className="flex items-center justify-center gap-2">
                            Processing...
                          </span>
                        ) : 'Apply Adjustment'}
                      </button>
                    </div>

                    {walletStatus && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm border border-emerald-500/20 text-center">{walletStatus}</div>}
                    {walletError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg text-sm border border-rose-500/20 text-center">{walletError}</div>}
                  </div>
                </div>

                {/* Additional controls can go here */}
                <div className={adminCardClass}>
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart2 width={18} className="text-[#81cc2a]" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Campaign Analytics</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Enter a campaign ID below to fetch detailed analytics including QR generation stats, redemption rates, and budget utilization.
                  </p>

                  {/* Campaign Analytics Form would go here, reusing same styles */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Campaign ID</label>
                      <div className="flex gap-2">
                        <select
                          value={campaignAnalyticsId}
                          onChange={(e) => setCampaignAnalyticsId(e.target.value)}
                          className={adminInputClass}
                        >
                          <option value="">Select a campaign...</option>
                          {campaigns.map((campaign) => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.title || "Untitled"} • {campaign.Brand?.name || "Unknown Brand"}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => loadCampaignAnalytics(token, campaignAnalyticsId)}
                          disabled={!campaignAnalyticsId || isLoadingCampaignAnalytics}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-lg transition-colors"
                        >
                          <Search size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Analytics Feedback */}
              {isLoadingCampaignAnalytics && (
                <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                  <div className="flex flex-col items-center gap-2 text-slate-500 font-medium animate-pulse">
                    <BarChart2 size={24} className="opacity-50" />
                    Loading analytics data...
                  </div>
                </div>
              )}

              {campaignAnalyticsError && (
                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 flex items-center gap-3">
                  <AlertTriangle size={20} />
                  {campaignAnalyticsError}
                </div>
              )}

              {/* Campaign Analytics Results */}
              {campaignAnalytics && (
                <div className="grid gap-6 lg:grid-cols-[2fr,1fr] animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3 text-xs">
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Total QRs</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {campaignAnalytics.metrics?.totalQrs || 0}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Redeemed</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {campaignAnalytics.metrics?.redeemedQrs || 0}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Failed</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {campaignAnalytics.metrics?.failedQrs || 0}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Wallet per QR</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          INR {formatAmount(campaignAnalytics.metrics?.walletDeductionPerQr || 0)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Wallet total</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          INR {formatAmount(campaignAnalytics.metrics?.walletDeductionTotal || 0)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Redemption rate</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {campaignAnalytics.metrics?.redemptionRate || "0.00"}%
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 text-xs">
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Status</div>
                        <div className="text-slate-900 dark:text-white">
                          {campaignAnalytics.campaign?.status || "-"}
                        </div>
                        <div className="text-slate-500 mt-1">
                          Validity: {formatDate(campaignAnalytics.validity?.startDate)} →{" "}
                          {formatDate(campaignAnalytics.validity?.endDate)}
                        </div>
                        <div className="text-slate-500">
                          Days remaining: {campaignAnalytics.validity?.daysRemaining ?? 0}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="text-slate-500">Usage</div>
                        <div className="text-slate-900 dark:text-white">
                          Orders: {campaignAnalytics.metrics?.orders || 0}
                        </div>
                        <div className="text-slate-500">
                          Ordered QRs: {campaignAnalytics.metrics?.orderedQuantity || 0}
                        </div>
                        <div className="text-slate-500">
                          Unique redeemers: {campaignAnalytics.metrics?.uniqueRedeemers || 0}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 text-xs">
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="font-semibold text-slate-900 dark:text-white mb-2">Recent QRs</div>
                        {campaignAnalytics.recentQrs?.length ? (
                          <div className="space-y-1 text-slate-500 dark:text-slate-400">
                            {campaignAnalytics.recentQrs.map((qr) => (
                              <div key={qr.uniqueHash} className="flex items-center justify-between">
                                <span>{qr.uniqueHash.slice(0, 8)}...</span>
                                <span className={getStatusClasses(qr.status)}>{qr.status}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-500">No QR activity yet.</div>
                        )}
                      </div>
                      <div className="rounded-lg bg-slate-50/70 dark:bg-white/5 p-3">
                        <div className="font-semibold text-slate-900 dark:text-white mb-2">Recent Redemptions</div>
                        {campaignAnalytics.recentRedemptions?.length ? (
                          <div className="space-y-1 text-slate-500 dark:text-slate-400">
                            {campaignAnalytics.recentRedemptions.map((qr) => (
                              <div key={qr.uniqueHash} className="flex items-center justify-between">
                                <span>{qr.uniqueHash.slice(0, 8)}...</span>
                                <span>{formatDate(qr.redeemedAt)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-500">No redemptions yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Edit Campaign</h4>
                    <input
                      type="text"
                      value={campaignEditForm.title}
                      onChange={(e) => setCampaignEditForm({ ...campaignEditForm, title: e.target.value })}
                      placeholder="Title"
                      className={adminInputClass}
                    />
                    <textarea
                      rows="3"
                      value={campaignEditForm.description}
                      onChange={(e) =>
                        setCampaignEditForm({ ...campaignEditForm, description: e.target.value })
                      }
                      placeholder="Description"
                      className={adminInputClass}
                    />
                    <input
                      type="number"
                      value={campaignEditForm.cashbackAmount}
                      onChange={(e) =>
                        setCampaignEditForm({ ...campaignEditForm, cashbackAmount: e.target.value })
                      }
                      placeholder="Cashback amount"
                      className={adminInputClass}
                    />
                    <input
                      type="date"
                      value={campaignEditForm.startDate}
                      onChange={(e) =>
                        setCampaignEditForm({ ...campaignEditForm, startDate: e.target.value })
                      }
                      className={adminInputClass}
                    />
                    <input
                      type="date"
                      value={campaignEditForm.endDate}
                      onChange={(e) =>
                        setCampaignEditForm({ ...campaignEditForm, endDate: e.target.value })
                      }
                      className={adminInputClass}
                    />
                    <input
                      type="number"
                      value={campaignEditForm.totalBudget}
                      onChange={(e) =>
                        setCampaignEditForm({ ...campaignEditForm, totalBudget: e.target.value })
                      }
                      placeholder="Total budget"
                      className={adminInputClass}
                    />
                    <input
                      type="number"
                      value={campaignEditForm.subtotal}
                      onChange={(e) =>
                        setCampaignEditForm({ ...campaignEditForm, subtotal: e.target.value })
                      }
                      placeholder="Subtotal"
                      className={adminInputClass}
                    />
                    <button
                      type="button"
                      onClick={handleCampaignDetailsSave}
                      disabled={isUpdatingCampaignDetails}
                      className={`${adminPrimaryButtonClass} disabled:opacity-50`}
                    >
                      {isUpdatingCampaignDetails ? "Saving..." : "Save Changes"}
                    </button>
                    {campaignEditStatus && <div className="text-xs text-emerald-500">{campaignEditStatus}</div>}
                    {campaignEditError && <div className="text-xs text-rose-400">{campaignEditError}</div>}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Campaigns Section */}
          {isCampaignsRoute && (
            <section id="campaigns" className="space-y-6 mt-12">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Campaigns</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Review vendor campaign requests and approve or pause activity.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {campaigns.length > 6 && (
                    <button
                      onClick={() => setShowAllCampaigns((prev) => !prev)}
                      className={adminGhostButtonClass}
                    >
                      {showAllCampaigns ? "Show less" : `View all (${campaigns.length})`}
                    </button>
                  )}
                  <button
                    onClick={() => loadCampaigns()}
                    disabled={isLoadingCampaigns}
                    className={adminGhostButtonClass}
                  >
                    <RefreshCw size={14} className="inline-block mr-1" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
                <div className={`${adminPanelClass} p-6`}>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Status Override</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={campaignControl.id}
                      onChange={(e) => setCampaignControl({ ...campaignControl, id: e.target.value })}
                      placeholder="Campaign ID"
                      className={adminInputClass}
                    />
                    <select
                      value={campaignControl.status}
                      onChange={(e) => setCampaignControl({ ...campaignControl, status: e.target.value })}
                      className={adminInputClass}
                    >
                      <option value="active" className={adminOptionClass}>Active</option>
                      <option value="paused" className={adminOptionClass}>Paused</option>
                      <option value="rejected" className={adminOptionClass}>Rejected</option>
                      <option value="completed" className={adminOptionClass}>Completed</option>
                    </select>
                    <button
                      onClick={handleCampaignStatusUpdate}
                      disabled={isUpdatingCampaign}
                      className={`w-full ${adminPrimaryButtonClass} disabled:opacity-50`}
                    >
                      {isUpdatingCampaign ? 'Updating...' : 'Update Campaign'}
                    </button>
                    {campaignStatus && <div className="text-sm text-emerald-400">{campaignStatus}</div>}
                    {campaignError && <div className="text-sm text-rose-400">{campaignError}</div>}
                  </div>
                </div>

                <div className={`${adminPanelClass} p-6 space-y-4`}>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
                      Pending: {campaignStatusCounts.pending || 0}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                      Active: {campaignStatusCounts.active || 0}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 font-semibold">
                      Paused: {campaignStatusCounts.paused || 0}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 font-semibold">
                      Rejected: {campaignStatusCounts.rejected || 0}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                      Completed: {campaignStatusCounts.completed || 0}
                    </span>
                  </div>
                  {isLoadingCampaigns && <div className="text-sm text-slate-500">Loading campaigns...</div>}
                  {campaignsError && <div className="text-xs text-rose-400">{campaignsError}</div>}
                  {!isLoadingCampaigns && campaigns.length === 0 && (
                    <div className="text-sm text-slate-500">No vendor campaigns yet.</div>
                  )}
                  {limitedCampaigns.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-white/5">
                          <tr>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Campaign</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Brand</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Vendor</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Budget</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Status</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {limitedCampaigns.map((campaign) => {
                            const currentStatus = String(campaign.status || "pending").toLowerCase();
                            const brandLabel = campaign.Brand?.name || "-";
                            const vendorLabel =
                              campaign.Brand?.Vendor?.businessName ||
                              campaign.Brand?.Vendor?.User?.email ||
                              campaign.Brand?.Vendor?.contactEmail ||
                              "-";
                            return (
                              <tr
                                key={campaign.id}
                                className="border-t border-slate-200/70 dark:border-white/5"
                              >
                                <td className="py-3 px-3 text-slate-900 dark:text-white">
                                  <div className="font-semibold">{campaign.title || "Campaign"}</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {campaign.id.slice(0, 8)}...
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-slate-900 dark:text-white/70">{brandLabel}</td>
                                <td className="py-3 px-3 text-slate-900 dark:text-white/70">{vendorLabel}</td>
                                <td className="py-3 px-3 text-slate-900 dark:text-white/70">
                                  INR {formatAmount(campaign.totalBudget)}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                                      currentStatus
                                    )}`}
                                  >
                                    {currentStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={campaignStatusUpdates[campaign.id] || currentStatus}
                                      onChange={(e) =>
                                        setCampaignStatusUpdates({
                                          ...campaignStatusUpdates,
                                          [campaign.id]: e.target.value,
                                        })
                                      }
                                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#81cc2a]"
                                    >
                                      <option value="pending" disabled className={adminOptionClass}>
                                        Pending
                                      </option>
                                      <option value="active" className={adminOptionClass}>Active</option>
                                      <option value="paused" className={adminOptionClass}>Paused</option>
                                      <option value="rejected" className={adminOptionClass}>Rejected</option>
                                      <option value="completed" className={adminOptionClass}>Completed</option>
                                    </select>
                                    <button
                                      onClick={() => handleCampaignRowStatusSave(campaign.id, currentStatus)}
                                      className="px-3 py-1 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-slate-900 dark:text-white text-xs font-semibold transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCampaign(campaign)}
                                      disabled={deletingCampaignId === campaign.id}
                                      className="px-3 py-1 rounded-lg border border-rose-200/70 text-rose-600 hover:text-rose-700 hover:border-rose-300 text-xs font-semibold disabled:opacity-60 dark:border-rose-400/40 dark:text-rose-300"
                                    >
                                      {deletingCampaignId === campaign.id ? "Deleting..." : "Delete"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCampaignAnalyticsId(campaign.id)}
                                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-900 dark:text-white"
                                    >
                                      Inspect
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {campaignActionStatus && <div className="text-xs text-emerald-400">{campaignActionStatus}</div>}
                  {campaignActionError && <div className="text-xs text-rose-400">{campaignActionError}</div>}
                </div>
              </div>
            </section>
          )}

          {/* Orders Section */}
          {isOrdersRoute && (
            <section id="orders" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {qrBatchSummary.length > 0 && (
                <div className={`${adminPanelClass} p-6 space-y-5`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">QR Batch Overview</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Summarized from QR inventory (campaign, cashback, batch size).
                        {qrsCoverageLabel ? ` ${qrsCoverageLabel}.` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                        Active: {qrBatchActiveTotal}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white/60 font-semibold">
                        Batches: {sortedQrBatchSummary.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={qrBatchSearch}
                          onChange={(event) => {
                            setQrBatchSearch(event.target.value);
                            setShowAllQrBatches(false);
                          }}
                          placeholder="Search campaign, brand, vendor"
                          className="w-full rounded-lg border border-slate-200 bg-white/80 px-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#81cc2a] dark:border-white/10 dark:bg-[#0f0f11] dark:text-white dark:placeholder:text-white/40"
                        />
                      </div>
                      <select
                        value={qrBatchSort}
                        onChange={(event) => setQrBatchSort(event.target.value)}
                        className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#81cc2a] dark:border-white/10 dark:bg-[#0f0f11] dark:text-white"
                      >
                        <option value="recent">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="qty">Highest Qty</option>
                        <option value="active">Most Active</option>
                        <option value="cashback">Highest Cashback</option>
                      </select>
                    </div>
                    {sortedQrBatchSummary.length > qrBatchPreviewLimit && (
                      <button
                        onClick={() => setShowAllQrBatches((prev) => !prev)}
                        className={adminGhostButtonClass}
                      >
                        {showAllQrBatches
                          ? "Show less"
                          : `View all (${sortedQrBatchSummary.length})`}
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sortedQrBatchSummary.length === 0
                      ? "No batches match your search."
                      : showAllQrBatches
                        ? `Showing ${sortedQrBatchSummary.length} batches.`
                        : `Showing ${visibleQrBatchSummary.length} of ${sortedQrBatchSummary.length} batches.`}
                  </div>

                  {sortedQrBatchSummary.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200/70 dark:border-white/10 p-6 text-sm text-slate-500 dark:text-slate-400">
                      No QR batches to display.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-white/5">
                          <tr>
                            <th className="text-left py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">Campaign</th>
                            <th className="text-right py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">Cashback</th>
                            <th className="text-right py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">Qty</th>
                            <th className="text-right py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">Active</th>
                            <th className="text-right py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">Redeemed</th>
                            <th className="text-left py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">Last Batch</th>
                            <th className="text-left py-2.5 px-3 text-slate-900 dark:text-white/60 font-medium">PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleQrBatchSummary.map((batch) => (
                            <tr
                              key={batch.id}
                              className="border-t border-slate-200/70 dark:border-white/5 hover:bg-slate-50/60 dark:hover:bg-white/[0.04] transition-colors"
                            >
                              <td className="py-2.5 px-3 text-slate-900 dark:text-white">
                                <div className="font-semibold">{batch.campaignTitle}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {batch.brandName} • {batch.vendorLabel}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white/70">
                                INR {formatAmount(batch.cashbackAmount)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white/70">{batch.total}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-500">{batch.active}</td>
                              <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white/70">{batch.redeemed}</td>
                              <td className="py-2.5 px-3 text-slate-900 dark:text-white/60 text-xs">
                                {formatDate(batch.lastCreatedAt)}
                              </td>
                              <td className="py-2.5 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadQrBatchPdf(batch)}
                                  disabled={isPreparingBatchPdf}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                >
                                  <Download size={14} />
                                  {isPreparingBatchPdf ? "Preparing..." : "Download"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {qrBatchStatus && <div className="text-xs text-emerald-400">{qrBatchStatus}</div>}
                  {qrBatchError && <div className="text-xs text-rose-400">{qrBatchError}</div>}
                </div>
              )}
              {/* Loading Overlay for PDF */}
              {isPreparingBatchPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-white dark:bg-[#1a1a1c] p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <RefreshCw className="animate-spin text-[#81cc2a]" size={32} />
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Generating PDF</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{qrBatchStatus}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Hidden Canvas Container for PDF Generation */}
          <div style={{ position: "absolute", left: "-9999px", top: "-9999px", visibility: "hidden" }}>
            {batchQrs.map(qr => (
              <QRCodeCanvas
                key={qr.uniqueHash}
                id={`pdf-qr-${qr.uniqueHash}`}
                value={getQrValue(qr.uniqueHash)} // Need getQrValue available here
                size={256}
                level="H"
                includeMargin={true}
              />
            ))}
          </div>

          {/* Payouts/Withdrawals Section */}
          {isPayoutsRoute && (
            <section id="payouts" className="space-y-6 mt-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payouts</h2>
              <div className={`${adminPanelClass} p-6`}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Process Withdrawal</h3>
                <div className="grid gap-4 lg:grid-cols-2 mb-4">
                  <input
                    type="text"
                    value={withdrawalAction.id}
                    onChange={(e) => setWithdrawalAction({ ...withdrawalAction, id: e.target.value })}
                    placeholder="Withdrawal ID"
                    className={adminInputClass}
                  />
                  <select
                    value={withdrawalAction.status}
                    onChange={(e) => setWithdrawalAction({ ...withdrawalAction, status: e.target.value })}
                    className={adminInputClass}
                  >
                    <option value="processed" className={adminOptionClass}>Processed</option>
                    <option value="rejected" className={adminOptionClass}>Rejected</option>
                  </select>
                  <input
                    type="text"
                    value={withdrawalAction.referenceId}
                    onChange={(e) => setWithdrawalAction({ ...withdrawalAction, referenceId: e.target.value })}
                    placeholder="Reference ID (optional)"
                    className={adminInputClass}
                  />
                  <input
                    type="text"
                    value={withdrawalAction.adminNote}
                    onChange={(e) => setWithdrawalAction({ ...withdrawalAction, adminNote: e.target.value })}
                    placeholder="Admin note (optional)"
                    className={adminInputClass}
                  />
                </div>
                <button
                  onClick={handleWithdrawalProcess}
                  className={`${adminPrimaryButtonClass} disabled:opacity-50`}
                >
                  Process Withdrawal
                </button>
                {withdrawalStatus && <div className="mt-2 text-sm text-emerald-400">{withdrawalStatus}</div>}
                {withdrawalError && <div className="mt-2 text-sm text-rose-400">{withdrawalError}</div>}

                {withdrawalPreview.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-3">Pending Withdrawals</h4>
                    <div className="space-y-2">
                      {withdrawalPreview.map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 transition-colors"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">ID: {withdrawal.id}</div>
                            <div className="text-xs text-slate-900 dark:text-white/60">{formatDate(withdrawal.createdAt)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">INR {formatAmount(withdrawal.amount)}</div>
                            <div className={`text-xs font-semibold ${getStatusClasses(withdrawal.status)}`}>
                              {withdrawal.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Continue with remaining sections... */}
          {isTransactionsRoute && (
            <section id="transactions" className="space-y-6 mt-12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vendor Transactions</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300 max-w-xl">
                    Manual admin recharges are hidden so the table stays focused on vendor payouts and
                    cashback settlements tied to campaigns.
                  </p>
                </div>
                {vendorTransactions.length > 8 && (
                  <button
                    onClick={() => setShowAllTransactions((prev) => !prev)}
                    className={`${adminGhostButtonClass} whitespace-nowrap`}
                  >
                    {showAllTransactions ? "Show less" : `View all (${vendorTransactions.length})`}
                  </button>
                )}
              </div>
              {isLoadingTransactions && <div className="text-slate-900 dark:text-white/60">Loading...</div>}
              {transactionsError && <div className="text-rose-400">{transactionsError}</div>}
              {!isLoadingTransactions && vendorTransactions.length === 0 ? (
                <div className="text-slate-900 dark:text-white/60">No vendor settlements yet.</div>
              ) : (
                <div className={`${adminPanelClass} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5 uppercase text-xs tracking-wide text-slate-500 dark:text-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Vendor</th>
                          <th className="px-4 py-3 text-left">Campaign</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {limitedVendorTransactions.map((tx) => {
                          const vendor = tx.Wallet?.Vendor;
                          const vendorName =
                            vendor?.businessName || vendor?.User?.name || vendor?.id || "Vendor";
                          const vendorContact =
                            vendor?.contactEmail ||
                            vendor?.User?.email ||
                            vendor?.contactPhone ||
                            vendor?.User?.name ||
                            "-";
                          const campaignLabel = extractCampaignTitle(tx.description);
                          const amountClass =
                            tx.type === "debit" ? "text-rose-500 dark:text-rose-300" : "text-emerald-500 dark:text-emerald-300";
                          return (
                            <tr
                              key={tx.id}
                              className="border-t border-slate-200/70 dark:border-white/5 last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatDate(tx.createdAt)}</td>
                              <td className="px-4 py-3 text-slate-900 dark:text-white">
                                <div className="font-semibold">{vendorName}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{vendorContact}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-800 dark:text-slate-200 max-w-[180px] whitespace-normal">
                                {campaignLabel}
                              </td>
                              <td className="px-4 py-3 text-slate-900 dark:text-white/70 text-xs tracking-wide">
                                {(tx.category || "N/A").replace(/_/g, " ")}
                              </td>
                              <td className={`px-4 py-3 text-right font-semibold ${amountClass}`}>
                                {tx.type === "debit" ? "-" : "+"}INR {formatAmount(tx.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(tx.status)}`}
                                >
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Users Management Section */}
          {isUsersRoute && (
            <section id="users" className="space-y-6 mt-12">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Users Management</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-sm text-slate-900 dark:text-white/60">
                    Total: {users.length}
                  </span>
                  {showAllUsers ? (
                    <button
                      onClick={() => setShowAllUsers(false)}
                      className={adminGhostButtonClass}
                    >
                      Show Less
                    </button>
                  ) : filteredUsers.length > 6 && (
                    <button
                      onClick={() => setShowAllUsers(true)}
                      className="px-4 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-sm text-slate-900 dark:text-white transition-colors"
                    >
                      View All ({filteredUsers.length})
                    </button>
                  )}
                </div>
              </div>

              {isLoadingUsers && <div className="text-slate-900 dark:text-white/60">Loading users...</div>}
              {usersError && <div className="text-rose-400">{usersError}</div>}

              {limitedUsers.length > 0 && (
                <div className={`${adminPanelClass} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5">
                        <tr>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Name</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Email</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Phone</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Status</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Joined</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {limitedUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-t border-slate-200/70 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-6 text-slate-900 dark:text-white font-medium">{user.name || '-'}</td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white/60">{user.email}</td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white/60">{user.phoneNumber || '-'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(user.status)}`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white/60 text-xs">{formatDate(user.createdAt)}</td>
                            <td className="py-4 px-6">
                              <select
                                value={userStatusUpdates[user.id] || user.status}
                                onChange={(e) => setUserStatusUpdates({ ...userStatusUpdates, [user.id]: e.target.value })}
                                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#81cc2a]"
                              >
                                <option value="active" className={adminOptionClass}>Active</option>
                                <option value="inactive" className={adminOptionClass}>Inactive</option>
                                <option value="blocked" className={adminOptionClass}>Blocked</option>
                              </select>
                              <button
                                onClick={() => handleUserStatusSave(user.id, user.status)}
                                className="ml-2 px-3 py-1 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-slate-900 dark:text-white text-xs font-semibold transition-colors"
                              >
                                Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {userActionStatus && <div className="p-4 text-sm text-emerald-400">{userActionStatus}</div>}
                  {userActionError && <div className="p-4 text-sm text-rose-400">{userActionError}</div>}
                </div>
              )}
            </section>
          )}

          {/* Vendors Management Section */}
          {shouldRenderVendorsSection && (
            <section id="vendors" className="space-y-6 mt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isSubscriptionsRoute ? "Subscriptions" : "Vendors Management"}
                  </h2>
                  {isSubscriptionsRoute && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage subscription health and vendor access.
                    </p>
                  )}
                </div>
                {showVendorSummaries && (
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-sm text-emerald-400">
                      Active: {effectiveVendorStatusCounts.active || 0}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-sm text-slate-900 dark:text-white/60">
                      Total: {vendors.length}
                    </span>
                    {showAllVendors ? (
                      <button
                        onClick={() => setShowAllVendors(false)}
                        className={adminGhostButtonClass}
                      >
                        Show Less
                      </button>
                    ) : filteredVendors.length > 6 && (
                      <button
                        onClick={() => setShowAllVendors(true)}
                        className="px-4 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-sm text-slate-900 dark:text-white transition-colors"
                      >
                        View All ({filteredVendors.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
              {showBrandCreation && (
                <div id="vendors-create" className={`${adminPanelClass} p-6 space-y-5`}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                        Create Brand & Vendor
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Brand name will be the vendor username; an 8-digit password is generated and shown once.
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed md:text-right">
                      Pick a subscription duration to provision access.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Brand Name</label>
                      <input
                        type="text"
                        value={brandForm.brandName}
                        onChange={handleBrandFormChange("brandName")}
                        placeholder="Excellence Apparel"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subscription Duration</label>
                      <select
                        value={brandForm.subscriptionDuration}
                        onChange={handleBrandFormChange("subscriptionDuration")}
                        className={adminInputClass}
                      >
                        {subscriptionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Website (optional)</label>
                      <input
                        type="url"
                        value={brandForm.website}
                        onChange={handleBrandFormChange("website")}
                        placeholder="https://brand.com"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Brand Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBrandLogoUpload}
                        className={adminInputClass}
                      />
                      {brandForm.logoUrl && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <img
                            src={brandForm.logoUrl}
                            alt="Brand logo preview"
                            className="h-8 w-8 rounded-lg object-cover border border-slate-200/70 dark:border-white/10"
                          />
                          <span>Logo uploaded</span>
                        </div>
                      )}
                      {isUploadingBrandLogo && (
                        <div className="text-[11px] text-slate-500">Uploading...</div>
                      )}
                      {brandLogoUploadStatus && (
                        <div className="text-[11px] text-emerald-600">{brandLogoUploadStatus}</div>
                      )}
                      {brandLogoUploadError && (
                        <div className="text-[11px] text-rose-600">{brandLogoUploadError}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">QR price per unit (INR)</label>
                      <input
                        type="number"
                        min="0.01"
                        max={MAX_QR_PRICE}
                        step="0.01"
                        value={brandForm.qrPricePerUnit}
                        onChange={handleBrandFormChange("qrPricePerUnit")}
                        placeholder="1.00"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vendor Email</label>
                      <input
                        type="email"
                        value={brandForm.vendorEmail}
                        onChange={handleBrandFormChange("vendorEmail")}
                        placeholder="contact@brand.com"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vendor Phone</label>
                      <input
                        type="text"
                        value={brandForm.vendorPhone}
                        onChange={handleBrandFormChange("vendorPhone")}
                        placeholder="+91 98765 43210"
                        className={adminInputClass}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateBrand}
                    disabled={isCreatingBrand}
                    className={adminPrimaryButtonClass}
                  >
                    {isCreatingBrand ? "Creating brand..." : "Create brand & vendor"}
                  </button>
                  {brandCreationMessage && (
                    <div className="text-xs text-emerald-600">{brandCreationMessage}</div>
                  )}
                  {brandCreationError && (
                    <div className="text-xs text-rose-600">{brandCreationError}</div>
                  )}
                  <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Vendor username:</span>
                      <span className="font-mono">
                        {createdBrandCredentials?.username ||
                          (brandForm.brandName.trim() ? brandForm.brandName.trim() : "Generated from brand name")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Temporary password (8 digits):</span>
                      <span className="font-mono">
                        {createdBrandCredentials?.password || "Generated after creation"}
                      </span>
                    </div>
                  </div>
                  {createdBrandDetails && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <div>Brand ID: {createdBrandDetails.brand?.id}</div>
                      <div>Subscription ends: {formatDate(createdBrandDetails.subscription?.endDate)}</div>
                    </div>
                  )}
                </div>
              )}

              {showVendorSummaries && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id="vendors-active"
                    className={`${adminPanelClass} space-y-3 border-l-4 border-emerald-400/60`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Active Subscriptions
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Vendors with a live subscription.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-500">
                        {subscriptionBuckets.active.length} total
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {subscriptionBuckets.active.slice(0, 3).map((sub) => (
                        <li key={sub.id} className="flex items-center justify-between">
                          <div className="text-slate-900 dark:text-white">
                            {sub.Brand?.name || "Brand"}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {sub.Brand?.Vendor?.businessName || sub.Brand?.Vendor?.User?.name || "Vendor"}
                          </span>
                        </li>
                      ))}
                      {!subscriptionBuckets.active.length && (
                        <li className="text-xs text-slate-500">No active subscriptions yet.</li>
                      )}
                    </ul>
                  </div>
                  <div
                    id="vendors-paused"
                    className={`${adminPanelClass} space-y-3 border-l-4 border-amber-400/60`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Paused / Expired
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Vendors needing admin attention.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-amber-500">
                        {subscriptionBuckets.paused.length + subscriptionBuckets.expired.length}
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {[...subscriptionBuckets.paused, ...subscriptionBuckets.expired].slice(0, 4).map(
                        (sub) => (
                          <li key={sub.id} className="flex items-center justify-between">
                            <div className="text-slate-900 dark:text-white">
                              {sub.Brand?.name || "Brand"}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {sub.status}
                            </span>
                          </li>
                        )
                      )}
                      {!subscriptionBuckets.paused.length && !subscriptionBuckets.expired.length && (
                        <li className="text-xs text-slate-500">All subscriptions are active.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {showSubscriptionControls && (
                <div id="subscriptions" className={`${adminPanelClass} space-y-4`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Subscription Controls
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Activate, pause, extend, or renew subscription cycles.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-500">
                        Active: {subscriptionCounts.active}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-xs font-semibold text-amber-500">
                        Paused: {subscriptionCounts.paused}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-rose-500/10 text-xs font-semibold text-rose-500">
                        Expired: {subscriptionCounts.expired}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vendor</label>
                      <select
                        value={subscriptionForm.vendorId}
                        onChange={handleSubscriptionFormChange("vendorId")}
                        className={adminInputClass}
                      >
                        <option value="">Select vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.businessName ||
                              vendor.Brand?.name ||
                              vendor.contactEmail ||
                              vendor.User?.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Action</label>
                      <select
                        value={subscriptionForm.action}
                        onChange={handleSubscriptionFormChange("action")}
                        className={adminInputClass}
                      >
                        <option value="renew">Renew / Change Duration</option>
                        <option value="extend">Extend (months)</option>
                        <option value="activate">Activate</option>
                        <option value="pause">Pause</option>
                        <option value="expire">Expire</option>
                      </select>
                    </div>
                    {subscriptionForm.action === "renew" && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duration</label>
                        <select
                          value={subscriptionForm.subscriptionType}
                          onChange={handleSubscriptionFormChange("subscriptionType")}
                          className={adminInputClass}
                        >
                          {subscriptionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {subscriptionForm.action === "extend" && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Extend by (months)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={subscriptionForm.extendMonths}
                          onChange={handleSubscriptionFormChange("extendMonths")}
                          className={adminInputClass}
                          placeholder="6"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter view</label>
                      <select
                        value={subscriptionFilter}
                        onChange={(event) => setSubscriptionFilter(event.target.value)}
                        className={adminInputClass}
                      >
                        {subscriptionFilterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingSubscription}
                    onClick={handleSubscriptionAction}
                    className={adminPrimaryButtonClass}
                  >
                    {isUpdatingSubscription ? "Updating subscription..." : "Apply subscription update"}
                  </button>
                  {subscriptionMessage && (
                    <div className="text-xs text-emerald-600">{subscriptionMessage}</div>
                  )}
                  {subscriptionError && (
                    <div className="text-xs text-rose-600">{subscriptionError}</div>
                  )}
                  {isLoadingSubscriptions && (
                    <div className="text-sm text-slate-500">Loading subscriptions...</div>
                  )}
                  {subscriptionsError && (
                    <div className="text-xs text-rose-500">{subscriptionsError}</div>
                  )}
                  {subscriptions.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-white/5">
                          <tr>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Brand</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">QR Price</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Vendor</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Status</th>
                            <th className="text-left py-3 px-3 text-slate-900 dark:text-white/60 font-medium">Ends</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptions.map((subscription) => (
                            <tr
                              key={subscription.id}
                              className="border-t border-slate-200/70 dark:border-white/5"
                            >
                              <td className="py-3 px-3 text-slate-900 dark:text-white">
                                {subscription.Brand?.name || "Brand"}
                              </td>
                              <td className="py-3 px-3 text-slate-900 dark:text-white">
                                {Number.isFinite(Number(subscription.Brand?.qrPricePerUnit))
                                  ? `INR ${formatAmount(subscription.Brand?.qrPricePerUnit)}/QR`
                                  : "-"}
                              </td>
                              <td className="py-3 px-3 text-slate-900 dark:text-white">
                                {subscription.Brand?.Vendor?.businessName ||
                                  subscription.Brand?.Vendor?.contactEmail ||
                                  subscription.Brand?.Vendor?.User?.email ||
                                  "-"}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                                    subscription.status
                                  )}`}
                                >
                                  {subscription.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-900 dark:text-white/60 text-xs">
                                {formatDate(subscription.endDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {(showVendorTable || showSubscriptionControls) && isLoadingVendors && (
                <div className="text-slate-900 dark:text-white/60">Loading vendors...</div>
              )}
              {(showVendorTable || showSubscriptionControls) && vendorsError && (
                <div className="text-rose-400">{vendorsError}</div>
              )}

              {showVendorTable && limitedVendors.length > 0 && (
                <div className={`${adminPanelClass} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5">
                        <tr>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Brand</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Contact</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Email</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Subscription</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">QR Price</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Status</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Created</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {limitedVendors.map((vendor) => {
                          const brandName =
                            vendor.Brand?.name ||
                            vendor.businessName ||
                            vendor.User?.name ||
                            "Vendor";
                          const brandLogo = vendor.Brand?.logoUrl;
                          const subscriptionStatus = vendor.Brand?.Subscription?.status;
                          const subscriptionEnds = vendor.Brand?.Subscription?.endDate;
                          const qrPrice = vendor.Brand?.qrPricePerUnit;
                          const qrPriceLabel = Number.isFinite(Number(qrPrice))
                            ? `INR ${formatAmount(qrPrice)}/QR`
                            : "-";
                          const isViewing = isAccountModalOpen && selectedVendorId === vendor.id;
                          return (
                            <tr
                              key={vendor.id}
                              className="border-t border-slate-200/70 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="py-4 px-6 text-slate-900 dark:text-white">
                                <div className="flex items-center gap-3">
                                  {brandLogo ? (
                                    <img
                                      src={brandLogo}
                                      alt={`${brandName} logo`}
                                      className="h-9 w-9 rounded-lg object-cover border border-slate-200/70 dark:border-white/10"
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-[11px] font-semibold text-slate-500">
                                      {brandName?.slice(0, 2)?.toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{brandName}</div>
                                    {vendor.Brand?.status && (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Brand: {vendor.Brand.status}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-900 dark:text-white/60">
                                {vendor.contactPhone || vendor.User?.phoneNumber || "-"}
                              </td>
                              <td className="py-4 px-6 text-slate-900 dark:text-white/60">
                                {vendor.contactEmail || vendor.User?.email || "-"}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col gap-1">
                                  <span
                                    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getStatusClasses(
                                      subscriptionStatus
                                    )}`}
                                  >
                                    {subscriptionStatus || "pending"}
                                  </span>
                                  {subscriptionEnds && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      Exp {formatDate(subscriptionEnds)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-900 dark:text-white/60">
                                {qrPriceLabel}
                              </td>
                              <td className="py-4 px-6">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                                    vendor.status
                                  )}`}
                                >
                                  {vendor.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-900 dark:text-white/60 text-xs">{formatDate(vendor.createdAt)}</td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={vendorStatusUpdates[vendor.id] || vendor.status}
                                    onChange={(e) =>
                                      setVendorStatusUpdates({ ...vendorStatusUpdates, [vendor.id]: e.target.value })
                                    }
                                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#81cc2a]"
                                  >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="expired">Expired</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleVendorStatusSave(vendor.id, vendor.status)}
                                    className="px-3 py-1 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-slate-900 dark:text-white text-xs font-semibold transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAccountView({ vendorId: vendor.id, brandId: vendor.Brand?.id })}
                                    className="px-3 py-1 rounded-lg border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                  >
                                    {isViewing ? "Hide" : "View"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {vendorActionStatus && <div className="p-4 text-sm text-emerald-400">{vendorActionStatus}</div>}
                  {vendorActionError && <div className="p-4 text-sm text-rose-400">{vendorActionError}</div>}
                </div>
              )}

            </section>
          )}

          {/* QR Registry Section */}
          {isQrsRoute && (
            <section id="qrs" className="space-y-6 mt-12">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">QR Code Registry</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#81cc2a]/20 text-sm text-[#81cc2a]">
                    Active: {qrStatusCounts.active || 0}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-sm text-slate-900 dark:text-white/60">
                    Total: {qrsTotalLabel}
                  </span>
                  {qrsHasMore && (
                    <button
                      onClick={() => {
                        setShowAllQrs(true);
                        loadQrs(token, { page: qrsPage + 1, append: true });
                      }}
                      className={adminGhostButtonClass}
                    >
                      Load More
                    </button>
                  )}
                  {qrs.length > 8 && (
                    showAllQrs ? (
                      <button
                        onClick={() => setShowAllQrs(false)}
                        className={adminGhostButtonClass}
                      >
                        Show Less
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowAllQrs(true)}
                        className="px-4 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-sm text-slate-900 dark:text-white transition-colors"
                      >
                        View All ({qrsTotalLabel})
                      </button>
                    )
                  )}
                </div>
              </div>

              {isLoadingQrs && <div className="text-slate-900 dark:text-white/60">Loading QR codes...</div>}
              {qrsError && <div className="text-rose-400">{qrsError}</div>}

              {limitedQrs.length > 0 && (
                <div className={`${adminPanelClass} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5">
                        <tr>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">QR ID</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Vendor ID</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Campaign</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Status</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Scans</th>
                          <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {limitedQrs.map((qr) => (
                          <tr
                            key={qr.id}
                            className="border-t border-slate-200/70 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-6 text-slate-900 dark:text-white font-mono text-xs">{qr.id.substring(0, 8)}...</td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white/60">{qr.vendorId || '-'}</td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white/60">{qr.campaignId || '-'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(qr.status)}`}>
                                {qr.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white">{qr.scanCount || 0}</td>
                            <td className="py-4 px-6 text-slate-900 dark:text-white/60 text-xs">{formatDate(qr.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Users, Vendors, QRs sections continue from original file... */}

          {isAccountModalOpen && (
            <VendorAccountManager
              vendorId={selectedVendorId}
              brandId={selectedBrandId}
              token={token}
              onClose={closeAccountModal}
              onUpdate={() => {
                loadVendors(token);
                loadBrands(token);
              }}
            />
          )}
        </main>
      </div>
    </div >
  );
};

export default AdminDashboard;
