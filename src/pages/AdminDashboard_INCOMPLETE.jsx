import React, { useEffect, useMemo, useState } from "react";
import {
    Activity,
    ArrowLeftRight,
    BarChart3,
    Bell,
    Building2,
    CircleDollarSign,
    ClipboardList,
    LayoutGrid,
    Menu,
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
    HandCoins,
    Zap,
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

const rangeOptions = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
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
        return "text-emerald-400";
    }
    if (["pending"].includes(normalized)) {
        return "text-amber-400";
    }
    if (["paused", "inactive"].includes(normalized)) {
        return "text-yellow-400";
    }
    if (["rejected", "blocked", "failed"].includes(normalized)) {
        return "text-rose-400";
    }
    return "text-gray-400";
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
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const index = indexMap.get(key);
        if (index === undefined) return;

        const amount = Number(tx.amount) || 0;
        if (tx.type === "credit") credit[index] += amount;
        if (tx.type === "debit") debit[index] += amount;
    });

    const net = credit.map((value, index) => value - debit[index]);

    return { buckets, credit, debit, net };
};

const buildStatusCounts = (items, key) =>
    items.reduce((acc, item) => {
        const status = String(item?.[key] || "unknown").toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

const Sparkline = ({ data, stroke = "#81cc2a", fill = "rgba(129, 204, 42, 0.2)" }) => {
    if (!data || data.length === 0) {
        return <div className="h-16 w-full rounded-2xl bg-white/10" />;
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
        return localStorage.getItem(ADMIN_SIDEBAR_KEY) === "collapsed";
    });
    const [activeNav, setActiveNav] = useState("overview");
    const [analyticsRange, setAnalyticsRange] = useState(30);
    const [searchQuery, setSearchQuery] = useState("");

    const { effectiveTheme } = useTheme();
    const isAuthenticated = Boolean(token);

    const clearSession = (message) => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
        setAdminInfo(null);
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
      handleRequest Error(err, setWithdrawalsError, "Unable to load withdrawals.");
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

    const userStatusCounts = useMemo(() => buildStatusCounts(users, "status"), [users]);
    const vendorStatusCounts = useMemo(() => buildStatusCounts(vendors, "status"), [vendors]);
    const qrStatusCounts = useMemo(() => buildStatusCounts(qrs, "status"), [qrs]);

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
            title: tx.category?.replace(/_/g, ' ') || `Transaction #${tx.id}`,
            amount: tx.type === 'credit' ? Number(tx.amount) : -Number(tx.amount),
            date: new Date(tx.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            status: tx.status || 'Completed',
        }));
    }, [transactionPreview]);

    const greetingName = adminInfo?.name?.split(" ")[0] || "Admin";

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0d0d0e] via-[#1a1a1c] to-[#0d0d0e] flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-gradient-to-br from-[#2a2a2c] to-[#1f1f21] rounded-2xl p-8 border border-white/10 shadow-2xl">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#81cc2a] to-[#6ab024] flex items-center justify-center mb-4">
                                <ShieldCheck size={24} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
                            <p className="text-white/60">Sign in to access your dashboard</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-white/80 block mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#81cc2a] transition-colors"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-white/80 block mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#81cc2a] transition-colors"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                                />
                            </div>

                            <button
                                onClick={handleSignIn}
                                disabled={isSigningIn}
                                className="w-full px-4 py-3 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSigningIn ? 'Signing in...' : 'Sign In'}
                            </button>

                            {authError && (
                                <div className="text-sm text-rose-400 text-center">{authError}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Dashboard - (Continuing in next message due to length...)
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#0d0d0e] via-[#1a1a1c] to-[#0d0d0e] text-white">
            {/* Desktop Sidebar */}
            <div className={`hidden lg:block ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} transition-all duration-300`}>
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
                            onToggleCollapse={() => setSidebarOpen(false)}
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
                <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0d0d0e]/80 border-b border-white/10">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Open menu"
                                >
                                    <Menu size={20} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Overview</h1>
                                    <p className="text-sm text-white/60">Hi {greetingName}, welcome back!</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
                                    <Search size={16} className="text-white/40" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search users, vendors..."
                                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-48"
                                    />
                                </div>
                                <button
                                    onClick={() => loadAll(token)}
                                    disabled={isRefreshing}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                                    aria-label="Refresh"
                                >
                                    <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
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
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-6 space-y-8 max-w-[1800px] mx-auto">

                    {/* PART 1 will continue in next file write... */}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
