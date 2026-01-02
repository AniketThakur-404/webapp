import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
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
  PanelLeftClose,
  PanelLeftOpen,
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
import {
  loginWithEmail,
  getMe,
  getAdminDashboard,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminVendors,
  updateAdminVendorStatus,
  creditVendorWalletAdmin,
  updateAdminCampaignStatus,
  getAdminTransactions,
  getAdminQrs,
  getAdminWithdrawals,
  processAdminWithdrawal,
} from "../lib/api";

const ADMIN_TOKEN_KEY = "cashback_admin_token";
const ADMIN_SIDEBAR_KEY = "cashback_admin_sidebar";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "operations", label: "Operations", icon: Wallet },
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

const getStatusClasses = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["active", "success", "processed"].includes(normalized)) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (["pending"].includes(normalized)) {
    return "text-amber-600 dark:text-amber-400";
  }
  if (["paused", "inactive"].includes(normalized)) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  if (["rejected", "blocked", "failed"].includes(normalized)) {
    return "text-rose-600 dark:text-rose-400";
  }
  return "text-slate-500 dark:text-slate-400";
};

const adminPanelClass =
  "rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-[#2a2a2c] dark:via-[#1e1e20] dark:to-[#1f1f21] border border-slate-200/70 dark:border-white/10 shadow-xl text-slate-900 dark:text-white transition-colors duration-200";
const adminInputClass =
  "w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#81cc2a] focus:outline-none transition-colors dark:border-white/10 dark:bg-[#0f0f11] dark:text-white dark:placeholder:text-white/40";
const adminPrimaryButtonClass =
  "px-6 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-white font-semibold transition-colors";
const adminGhostButtonClass =
  "px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-900 transition-colors dark:bg-white/5 dark:hover:bg-white/10 dark:text-white";

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
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
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
  const [showAllVendors, setShowAllVendors] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [transactionsError, setTransactionsError] = useState("");
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const [qrs, setQrs] = useState([]);
  const [qrsError, setQrsError] = useState("");
  const [isLoadingQrs, setIsLoadingQrs] = useState(false);
  const [showAllQrs, setShowAllQrs] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsError, setWithdrawalsError] = useState("");
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [withdrawalAction, setWithdrawalAction] = useState({
    id: "",
    status: "processed",
    referenceId: "",
    adminNote: "",
  });
  const [withdrawalStatus, setWithdrawalStatus] = useState("");
  const [withdrawalError, setWithdrawalError] = useState("");
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);

  const [walletCredit, setWalletCredit] = useState({
    vendorId: "",
    amount: "",
    description: "",
  });
  const [walletStatus, setWalletStatus] = useState("");
  const [walletError, setWalletError] = useState("");
  const [isCreditingWallet, setIsCreditingWallet] = useState(false);

  const [campaignControl, setCampaignControl] = useState({
    id: "",
    status: "paused",
  });
  const [campaignStatus, setCampaignStatus] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(ADMIN_SIDEBAR_KEY);
    return saved === "collapsed" ? true : false; // Default to expanded
  });
  const [activeNav, setActiveNav] = useState("overview");
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [analyticsMetric, setAnalyticsMetric] = useState("transactions");
  const [searchQuery, setSearchQuery] = useState("");

  const isAuthenticated = Boolean(token);

  const clearSession = (message) => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setAdminInfo(null);
    setAuthStatus(message || "");
  };

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
      setUsers(data || []);
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
      setVendors(data || []);
    } catch (err) {
      handleRequestError(err, setVendorsError, "Unable to load vendors.");
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const loadTransactions = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingTransactions(true);
    setTransactionsError("");
    try {
      const data = await getAdminTransactions(authToken);
      setTransactions(data || []);
    } catch (err) {
      handleRequestError(err, setTransactionsError, "Unable to load transactions.");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadQrs = async (authToken = token) => {
    if (!authToken) return;
    setIsLoadingQrs(true);
    setQrsError("");
    try {
      const data = await getAdminQrs(authToken);
      setQrs(data || []);
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

  const loadAll = async (authToken = token) => {
    if (!authToken) return;
    setIsRefreshing(true);
    await Promise.all([
      loadDashboardStats(authToken),
      loadUsers(authToken),
      loadVendors(authToken),
      loadTransactions(authToken),
      loadQrs(authToken),
      loadWithdrawals(authToken),
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!token) return;
    loadAdmin(token);
    loadAll(token);
  }, [token]);

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
    setTransactions([]);
    setQrs([]);
    setWithdrawals([]);
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

  const handleWalletCredit = async () => {
    if (!walletCredit.vendorId.trim() || !walletCredit.amount) {
      setWalletError("Vendor ID and amount are required.");
      return;
    }
    setWalletError("");
    setWalletStatus("");
    setIsCreditingWallet(true);
    try {
      await creditVendorWalletAdmin(token, {
        vendorId: walletCredit.vendorId.trim(),
        amount: Number(walletCredit.amount),
        description: walletCredit.description.trim() || undefined,
      });
      setWalletStatus("Wallet credited successfully.");
      setWalletCredit({ vendorId: "", amount: "", description: "" });
      await loadTransactions(token);
    } catch (err) {
      handleRequestError(err, setWalletError, "Unable to credit vendor wallet.");
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
      await loadVendors(token);
    } catch (err) {
      handleRequestError(err, setCampaignError, "Unable to update campaign status.");
    } finally {
      setIsUpdatingCampaign(false);
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

  const handleNavClick = (id) => {
    setActiveNav(id);
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setSidebarOpen(false);
  };
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [normalizedSearch, users]);

  const filteredVendors = useMemo(() => {
    if (!normalizedSearch) return vendors;
    return vendors.filter((vendor) => {
      const values = [
        vendor.businessName,
        vendor.User?.email,
        vendor.contactPhone,
        vendor.gstin,
      ].filter(Boolean);
      return values.some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [normalizedSearch, vendors]);

  const limitedUsers = useMemo(
    () => (showAllUsers ? filteredUsers : filteredUsers.slice(0, 6)),
    [showAllUsers, filteredUsers]
  );
  const limitedVendors = useMemo(
    () => (showAllVendors ? filteredVendors : filteredVendors.slice(0, 6)),
    [showAllVendors, filteredVendors]
  );
  const limitedTransactions = useMemo(
    () => (showAllTransactions ? transactions : transactions.slice(0, 8)),
    [showAllTransactions, transactions]
  );
  const limitedQrs = useMemo(() => (showAllQrs ? qrs : qrs.slice(0, 8)), [showAllQrs, qrs]);
  const limitedWithdrawals = useMemo(
    () => (showAllWithdrawals ? withdrawals : withdrawals.slice(0, 6)),
    [showAllWithdrawals, withdrawals]
  );
  const transactionPreview = useMemo(() => transactions.slice(0, 5), [transactions]);
  const withdrawalPreview = useMemo(() => withdrawals.slice(0, 4), [withdrawals]);
  const pendingWithdrawalCount = useMemo(
    () => withdrawals.filter((withdrawal) => withdrawal.status === "pending").length,
    [withdrawals]
  );

  const transactionTotals = useMemo(
    () =>
      transactions.reduce(
        (acc, tx) => {
          const amount = Number(tx.amount) || 0;
          if (tx.type === "credit") acc.credit += amount;
          if (tx.type === "debit") acc.debit += amount;
          return acc;
        },
        { credit: 0, debit: 0 }
      ),
    [transactions]
  );

  const transactionSeries = useMemo(
    () => buildTransactionSeries(transactions, analyticsRange),
    [transactions, analyticsRange]
  );

  const userSeries = useMemo(
    () => buildCountSeries(users, analyticsRange, (user) => user.createdAt),
    [users, analyticsRange]
  );

  const qrSeries = useMemo(
    () => buildCountSeries(qrs, analyticsRange, (qr) => qr.createdAt),
    [qrs, analyticsRange]
  );

  const analyticsData = useMemo(() => {
    if (analyticsMetric === "users") {
      const total = userSeries.counts.reduce((sum, value) => sum + value, 0);
      return { data: userSeries.counts, label: "New users", total };
    }
    if (analyticsMetric === "qrs") {
      const total = qrSeries.counts.reduce((sum, value) => sum + value, 0);
      return { data: qrSeries.counts, label: "QR volume", total };
    }
    const total = transactionSeries.net.reduce((sum, value) => sum + value, 0);
    return { data: transactionSeries.net, label: "Net flow", total };
  }, [analyticsMetric, qrSeries.counts, transactionSeries.net, userSeries.counts]);

  const analyticsTrend = useMemo(() => {
    const data = analyticsData.data;
    if (!data || data.length < 4) return null;
    const midpoint = Math.floor(data.length / 2);
    const previous = data.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
    const current = data.slice(midpoint).reduce((sum, value) => sum + value, 0);
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }, [analyticsData.data]);

  const qrStatusCounts = useMemo(() => buildStatusCounts(qrs, "status"), [qrs]);
  const userStatusCounts = useMemo(() => buildStatusCounts(users, "status"), [users]);
  const vendorStatusCounts = useMemo(() => buildStatusCounts(vendors, "status"), [vendors]);

  const buildStatusRows = (counts) => {
    const entries = Object.entries(counts);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    return entries
      .map(([status, value]) => ({
        status,
        value,
        percent: total ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-[#f6f5ee] text-slate-900 font-admin-body dark:bg-[#0b0b0d] dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(129,204,42,0.18),transparent_50%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.95),transparent_55%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(236,255,120,0.18),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(129,204,42,0.2),transparent_45%),radial-gradient(circle_at_70%_90%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-slate-900 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/95 dark:shadow-[0_40px_90px_-60px_rgba(0,0,0,0.8)]">
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
              </div>
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
          </div>
        </div>
      </div>
    );
  }

  const greetingName = adminInfo?.name?.split(" ")[0] || "Jon Doe";
  const { effectiveTheme } = useTheme();

  // Calculate balance from dashboard stats
  const totalBalance = useMemo(() => {
    if (!dashboardStats) return 0;
    const credit = dashboardStats.totalCredit || 0;
    const debit = dashboardStats.totalDebit || 0;
    return credit - debit;
  }, [dashboardStats]);

  // Map transactions to activities for the card
  const recentActivities = useMemo(() => {
    return transactionPreview.map((tx, index) => ({
      id: tx.id || index,
      type: tx.type === 'credit' ? 'cashback' : 'transfer',
      title: tx.description || `Transaction #${tx.id}`,
      amount: tx.type === 'credit' ? Number(tx.amount) : -Number(tx.amount),
      date: new Date(tx.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: tx.status || 'Completed',
    }));
  }, [transactionPreview]);

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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
                <p className="text-sm text-slate-600 dark:text-white/60">Hi {greetingName}, welcome back!</p>
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
                {pendingWithdrawalCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#81cc2a] rounded-full" />
                )}
              </button>
              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6 max-w-[1800px] mx-auto">
          {/* Overview Section - Admin Stats */}
          <section id="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Total Balance Card */}
              <BalanceCard
                balance={totalBalance}
                accountNumber="*** *** **"
                savingsAccount={adminInfo?.email?.replace(/(@.*)/, '****') || 'Admin Account'}
              />

              {/* System Stats Card */}
              <div className={`${adminPanelClass} p-6`}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-900 dark:text-white/60">Active Users</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {userStatusCounts.active || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-900 dark:text-white/60">Active Vendors</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {vendorStatusCounts.active || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-900 dark:text-white/60">Total QR Codes</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {qrs.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-900 dark:text-white/60">Pending Withdrawals</span>
                    <span className="text-lg font-bold text-amber-400">
                      {pendingWithdrawalCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <RecentActivitiesCard activities={recentActivities} />
            </div>
          </section>

          {/* Analytics Section */}
          <section id="analytics" className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h2>
              <div className="flex gap-2">
                {rangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAnalyticsRange(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${analyticsRange === option.value
                      ? 'bg-[#81cc2a] text-slate-900 dark:text-white'
                      : 'bg-white/5 text-slate-900 dark:text-white/60 hover:bg-white/10'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Users", value: dashboardStats?.users },
                { label: "Vendors", value: dashboardStats?.vendors },
                { label: "Active campaigns", value: dashboardStats?.activeCampaigns },
                { label: "Total transactions", value: dashboardStats?.totalTransactions },
              ].map((stat) => (
                <div key={stat.label} className={`${adminPanelClass} p-6`}>
                  <div className="text-xs uppercase tracking-wide text-slate-900 dark:text-white/40">{stat.label}</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {isLoadingDashboard ? "..." : stat.value ?? "-"}
                  </div>
                </div>
              ))}
            </div>
            {dashboardError && <div className="text-sm text-rose-400">{dashboardError}</div>}

            <div className={`${adminPanelClass} p-6`}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Transaction Flow</h3>
                <p className="text-sm text-slate-900 dark:text-white/60">Last {analyticsRange} days</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="text-center">
                  <div className="text-sm text-slate-900 dark:text-white/60">Credits</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    INR {formatAmount(transactionTotals.credit)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-900 dark:text-white/60">Debits</div>
                  <div className="text-2xl font-bold text-rose-400">
                    INR {formatAmount(transactionTotals.debit)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-900 dark:text-white/60">Net Flow</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    INR {formatAmount(transactionTotals.credit - transactionTotals.debit)}
                  </div>
                </div>
              </div>
              <Sparkline data={transactionSeries.net} />
            </div>
          </section>

          {/* Operations Section */}
          <section id="operations" className="space-y-6 mt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Operations</h2>
            <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${adminPanelClass} p-6`}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Credit Vendor Wallet</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={walletCredit.vendorId}
                    onChange={(e) => setWalletCredit({ ...walletCredit, vendorId: e.target.value })}
                    placeholder="Vendor ID"
                    className={adminInputClass}
                  />
                  <input
                    type="number"
                    value={walletCredit.amount}
                    onChange={(e) => setWalletCredit({ ...walletCredit, amount: e.target.value })}
                    placeholder="Amount"
                    className={adminInputClass}
                  />
                  <input
                    type="text"
                    value={walletCredit.description}
                    onChange={(e) => setWalletCredit({ ...walletCredit, description: e.target.value })}
                    placeholder="Description (optional)"
                    className={adminInputClass}
                  />
                  <button
                    onClick={handleWalletCredit}
                    disabled={isCreditingWallet}
                    className={`w-full ${adminPrimaryButtonClass} disabled:opacity-50`}
                  >
                    {isCreditingWallet ? 'Processing...' : 'Credit Wallet'}
                  </button>
                  {walletStatus && <div className="text-sm text-emerald-400">{walletStatus}</div>}
                  {walletError && <div className="text-sm text-rose-400">{walletError}</div>}
                </div>
              </div>

              <div className={`${adminPanelClass} p-6`}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Campaign Control</h3>
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
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
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
            </div>
          </section>

          {/* Payouts/Withdrawals Section */}
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
                  <option value="processed">Processed</option>
                  <option value="rejected">Rejected</option>
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

          {/* Continue with remaining sections... */}
          <section id="transactions" className="space-y-6 mt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h2>
            {isLoadingTransactions && <div className="text-slate-900 dark:text-white/60">Loading...</div>}
            {transactionsError && <div className="text-rose-400">{transactionsError}</div>}
            {!isLoadingTransactions && transactionPreview.length === 0 ? (
              <div className="text-slate-900 dark:text-white/60">No transactions yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {transactionPreview.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-white">
                        {tx.category?.replace(/_/g, " ") || "Transaction"}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400/90">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {tx.type === "debit" ? "-" : "+"}INR {formatAmount(tx.amount)}
                      </div>
                      <div className={`text-[10px] font-semibold ${getStatusClasses(tx.status)}`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Users Management Section */}
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
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="blocked">Blocked</option>
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

          {/* Vendors Management Section */}
          <section id="vendors" className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vendors Management</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-sm text-emerald-400">
                  Active: {vendorStatusCounts.active || 0}
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
            </div>

            {isLoadingVendors && <div className="text-slate-900 dark:text-white/60">Loading vendors...</div>}
            {vendorsError && <div className="text-rose-400">{vendorsError}</div>}

            {limitedVendors.length > 0 && (
              <div className={`${adminPanelClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5">
                      <tr>
                        <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Business Name</th>
                        <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Contact</th>
                        <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Email</th>
                        <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Status</th>
                        <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Created</th>
                        <th className="text-left py-4 px-6 text-slate-900 dark:text-white/60 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {limitedVendors.map((vendor) => (
                        <tr
                          key={vendor.id}
                          className="border-t border-slate-200/70 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6 text-slate-900 dark:text-white font-medium">{vendor.businessName || '-'}</td>
                          <td className="py-4 px-6 text-slate-900 dark:text-white/60">{vendor.contactPhone || '-'}</td>
                          <td className="py-4 px-6 text-slate-900 dark:text-white/60">{vendor.User?.email || '-'}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(vendor.status)}`}>
                              {vendor.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-900 dark:text-white/60 text-xs">{formatDate(vendor.createdAt)}</td>
                          <td className="py-4 px-6">
                            <select
                              value={vendorStatusUpdates[vendor.id] || vendor.status}
                              onChange={(e) => setVendorStatusUpdates({ ...vendorStatusUpdates, [vendor.id]: e.target.value })}
                              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#81cc2a]"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <button
                              onClick={() => handleVendorStatusSave(vendor.id, vendor.status)}
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
                {vendorActionStatus && <div className="p-4 text-sm text-emerald-400">{vendorActionStatus}</div>}
                {vendorActionError && <div className="p-4 text-sm text-rose-400">{vendorActionError}</div>}
              </div>
            )}
          </section>

          {/* QR Registry Section */}
          <section id="qrs" className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">QR Code Registry</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-[#81cc2a]/20 text-sm text-[#81cc2a]">
                  Active: {qrStatusCounts.active || 0}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-sm text-slate-900 dark:text-white/60">
                  Total: {qrs.length}
                </span>
                {showAllQrs ? (
                  <button
                    onClick={() => setShowAllQrs(false)}
                    className={adminGhostButtonClass}
                  >
                    Show Less
                  </button>
                ) : qrs.length > 8 && (
                  <button
                    onClick={() => setShowAllQrs(true)}
                    className="px-4 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-sm text-slate-900 dark:text-white transition-colors"
                  >
                    View All ({qrs.length})
                  </button>
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

          {/* Users, Vendors, QRs sections continue from original file... */}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
