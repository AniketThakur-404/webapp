import React, { useState, useEffect } from "react";
import {
    X,
    Building2,
    Store,
    CreditCard,
    Megaphone,
    Save,
    Phone,
    Mail,
    MapPin,
    RotateCw,
    Power,
    CircleDollarSign,
    Briefcase,
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    Calendar,
    Wallet,
    Activity,
    Info,
    Eye,
    ShieldCheck,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    ShoppingBag,
    Download
} from "lucide-react";
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

const MAX_QR_PRICE = 100;
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { cn } from "../../lib/utils";

const COLORS = ["#81cc2a", "#f43f5e", "#fbbf24", "#64748b"];
import {
    getAdminVendorOverview,
    getAdminBrandOverview,
    updateAdminVendorDetails,
    updateAdminBrandDetails,
    uploadImage,
    updateAdminBrandStatus,
    updateAdminVendorCredentials,
    getAdminVendorCredentialRequests,
    approveAdminCredentialRequest,
    rejectAdminCredentialRequest,
    getAdminCampaignAnalytics,
    updateAdminVendorStatus,
    adjustVendorWalletAdmin,
    getAdminTransactionsFiltered,
    getAdminOrders,
    updateAdminCampaignStatus,
    getAdminQrBatch
} from "../../lib/api";

const NavButton = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${active
            ? "bg-[#81cc2a] text-white shadow-lg shadow-[#81cc2a]/20"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5"
            }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} className={active ? "text-white" : "opacity-70"} />
            {label}
        </div>
        {badge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-rose-500 text-white"
                }`}>
                {badge}
            </span>
        )}
    </button>
);

const MetricItem = ({ label, value }) => (
    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-white/5">
        <div className="text-xs text-slate-400 mb-1">{label}</div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
);

const InputGroup = ({ label, value, onChange, type = "text", min, max, step }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#81cc2a] transition-colors"
        />
    </div>
);

const VendorAccountManager = ({
    vendorId,
    brandId,
    onClose,
    token,
    onUpdate // Callback to refresh parent data if needed
}) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Data States
    const [vendorData, setVendorData] = useState(null);
    const [brandData, setBrandData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [orderActionError, setOrderActionError] = useState("");
    const [campaignStats, setCampaignStats] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);

    // PDF Generation State
    const [isPreparingBatchPdf, setIsPreparingBatchPdf] = useState(false);
    const [qrBatchStatus, setQrBatchStatus] = useState("");
    const [qrBatchError, setQrBatchError] = useState("");
    const [batchQrs, setBatchQrs] = useState([]);

    const getQrValue = (hash) => `${window.location.origin}/verify/${hash}`;
    const getBatchCanvasId = (hash) => `pdf-qr-${hash}`;

    // Edit Forms
    const [vendorForm, setVendorForm] = useState({
        businessName: "",
        contactPhone: "",
        contactEmail: "",
        gstin: "",
        address: ""
    });
    const [brandForm, setBrandForm] = useState({
        name: "",
        website: "",
        logoUrl: "",
        qrPricePerUnit: ""
    });
    const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
    const [brandLogoUploadStatus, setBrandLogoUploadStatus] = useState("");
    const [brandLogoUploadError, setBrandLogoUploadError] = useState("");
    const [brandStatusForm, setBrandStatusForm] = useState({
        status: "",
        reason: ""
    });
    const [credentialForm, setCredentialForm] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    });
    const [credentialRequests, setCredentialRequests] = useState([]);
    const [isLoadingCredentialRequests, setIsLoadingCredentialRequests] = useState(false);
    const [credentialRequestError, setCredentialRequestError] = useState("");
    const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);
    const [credentialActionStatus, setCredentialActionStatus] = useState("");
    const [credentialActionError, setCredentialActionError] = useState("");

    // Action States
    const [isSaving, setIsSaving] = useState(false);
    const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
    const [processingOrderId, setProcessingOrderId] = useState(null);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusClasses = (status) => {
        const s = String(status || "").toLowerCase();
        if (s === "active" || s === "paid" || s === "completed" || s === "shipped")
            return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
        if (s === "pending" || s === "processing")
            return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
        if (s === "paused" || s === "inactive")
            return "bg-secondary text-secondary-foreground border border-secondary/50"; // Using slate-ish colors
        if (s === "rejected" || s === "failed" || s === "expired")
            return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
        return "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400";
    };

    const handleRequestError = (err, setErrorState, defaultMessage) => {
        const message = err.response?.data?.message || err.message || defaultMessage;
        setErrorState(message);
        setActionMessage({ type: "error", text: message });
    };

    const loadCredentialRequests = async () => {
        if (!token || !vendorId) return;
        setIsLoadingCredentialRequests(true);
        setCredentialRequestError("");
        try {
            const data = await getAdminVendorCredentialRequests(token, vendorId, { status: "pending" });
            setCredentialRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setCredentialRequestError(err.message || "Failed to load credential requests.");
        } finally {
            setIsLoadingCredentialRequests(false);
        }
    };

    const pendingCredentialRequest = credentialRequests.find(
        (request) => String(request?.status || "").toLowerCase() === "pending"
    );

    // Fetch Data
    useEffect(() => {
        if (!token) return;
        loadData();
    }, [token, vendorId, brandId]);

    // Fetch Analytics when campaign is selected
    useEffect(() => {
        if (selectedCampaign) {
            loadCampaignAnalytics(selectedCampaign.id);
        } else {
            setAnalyticsData(null);
        }
    }, [selectedCampaign]);

    useEffect(() => {
        const fallbackUsername =
            pendingCredentialRequest?.requestedUsername ||
            vendorData?.vendor?.User?.username ||
            vendorData?.vendor?.User?.email ||
            "";

        if (!fallbackUsername) return;

        setCredentialForm((prev) => {
            if (prev.username) return prev;
            return { ...prev, username: fallbackUsername };
        });
    }, [pendingCredentialRequest?.requestedUsername, vendorData?.vendor?.User?.username, vendorData?.vendor?.User?.email]);

    const loadCampaignAnalytics = async (campaignId) => {
        try {
            const data = await getAdminCampaignAnalytics(token, campaignId);
            setAnalyticsData(data);
        } catch (err) {
            console.error("Failed to load campaign analytics", err);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        setError("");
        console.log("Loading Vendor Data:", { vendorId, brandId });

        try {
            // 1. Load Vendor Overview if ID exists
            if (vendorId) {
                const vData = await getAdminVendorOverview(token, vendorId);
                setVendorData(vData);
                setVendorForm({
                    businessName: vData.vendor?.businessName || "",
                    contactPhone: vData.vendor?.contactPhone || "",
                    contactEmail: vData.vendor?.contactEmail || "",
                    gstin: vData.vendor?.gstin || "",
                    address: vData.vendor?.address || ""
                });
            }

            // 2. Load Brand Overview if ID exists
            if (brandId) {
                const bData = await getAdminBrandOverview(token, brandId);
                setBrandData(bData);
                setBrandForm({
                    name: bData.brand?.name || "",
                    website: bData.brand?.website || "",
                    logoUrl: bData.brand?.logoUrl || "",
                    qrPricePerUnit:
                        bData.brand?.qrPricePerUnit !== undefined && bData.brand?.qrPricePerUnit !== null
                            ? String(bData.brand.qrPricePerUnit)
                            : ""
                });
                setBrandStatusForm({
                    status: bData.brand?.status || "active",
                    reason: ""
                });
            }

            // 3. Fetch Shared Data (Transactions & Orders)
            if (vendorId || brandId) {
                const params = {};
                if (vendorId) params.vendorId = vendorId;
                if (brandId) params.brandId = brandId;

                console.log("Fetching Lists with params:", params);

                // Fetch transactions
                try {
                    const txData = await getAdminTransactionsFiltered(token, params);
                    console.log("Transactions Data:", txData);
                    setTransactions(txData?.transactions || (Array.isArray(txData) ? txData : []));
                } catch (txErr) {
                    console.warn("Failed to load transactions", txErr);
                }

                // Fetch orders
                try {
                    // Only use vendorId for orders to avoid strict brand-campaign filtering on backend
                    const orderParams = {};
                    if (vendorId) orderParams.vendorId = vendorId;

                    console.log("[VendorAccountManager] Fetching orders with:", { vendorId, orderParams });
                    const ordersData = await getAdminOrders(token, orderParams);
                    console.log("[VendorAccountManager] Orders Data received:", ordersData);
                    setOrders(ordersData?.items || (Array.isArray(ordersData) ? ordersData : []));
                } catch (orderErr) {
                    console.warn("Failed to load orders", orderErr);
                    setOrders([]);
                }
            }

            if (vendorId) {
                await loadCredentialRequests();
            }

        } catch (err) {
            console.error(err);
            setError("Failed to load account details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveVendor = async () => {
        if (!vendorId) return;
        setIsSaving(true);
        setActionMessage({ type: "", text: "" });
        try {
            await updateAdminVendorDetails(token, vendorId, vendorForm);
            setActionMessage({ type: "success", text: "Vendor profile updated successfully." });
            if (onUpdate) onUpdate();
            loadData(); // Refresh to ensure sync
        } catch (err) {
            setActionMessage({ type: "error", text: err.message || "Failed to update vendor." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBrand = async () => {
        if (!brandId) return;
        const priceValue = brandForm.qrPricePerUnit === "" ? null : Number(brandForm.qrPricePerUnit);
        if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue <= 0 || priceValue > MAX_QR_PRICE)) {
            setActionMessage({
                type: "error",
                text: `QR price per unit must be between 0.01 and ${MAX_QR_PRICE}.`
            });
            return;
        }
        setIsSaving(true);
        setActionMessage({ type: "", text: "" });
        try {
            await updateAdminBrandDetails(token, brandId, brandForm);
            if (brandStatusForm.status !== brandData?.brand?.status) {
                await updateAdminBrandStatus(token, brandId, brandStatusForm);
            }
            setActionMessage({ type: "success", text: "Brand details updated successfully." });
            if (onUpdate) onUpdate();
            loadData();
        } catch (err) {
            setActionMessage({ type: "error", text: err.message || "Failed to update brand." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBrandLogoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!token) {
            setBrandLogoUploadError("Sign in to upload.");
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

    const handleCredentialUpdate = async ({ useRequestDefaults } = {}) => {
        if (!vendorId) return;
        setCredentialActionStatus("");
        setCredentialActionError("");

        const trimmedUsername = credentialForm.username.trim();
        const hasUsername = Boolean(trimmedUsername);
        const hasPassword = Boolean(credentialForm.password);

        if (hasPassword && credentialForm.password !== credentialForm.confirmPassword) {
            setCredentialActionError("Passwords do not match.");
            return;
        }

        const payload = {};
        if (!useRequestDefaults && hasUsername) payload.username = trimmedUsername;
        if (!useRequestDefaults && hasPassword) payload.password = credentialForm.password;

        if (!pendingCredentialRequest && !Object.keys(payload).length) {
            setCredentialActionError("Provide a username or password to update.");
            return;
        }

        if (pendingCredentialRequest && useRequestDefaults && !pendingCredentialRequest.requestedUsername && !pendingCredentialRequest.requestedPassword) {
            setCredentialActionError("No requested credentials available.");
            return;
        }

        setIsUpdatingCredentials(true);
        try {
            if (pendingCredentialRequest) {
                await approveAdminCredentialRequest(token, pendingCredentialRequest.id, payload);
                setCredentialActionStatus("Credential request approved.");
            } else {
                await updateAdminVendorCredentials(token, vendorId, payload);
                setCredentialActionStatus("Credentials updated.");
            }

            setCredentialForm((prev) => ({
                ...prev,
                password: "",
                confirmPassword: ""
            }));
            await loadCredentialRequests();
            await loadData();
        } catch (err) {
            setCredentialActionError(err.message || "Failed to update credentials.");
        } finally {
            setIsUpdatingCredentials(false);
        }
    };

    const handleRejectCredentialRequest = async () => {
        if (!pendingCredentialRequest) return;
        setCredentialActionStatus("");
        setCredentialActionError("");
        setIsUpdatingCredentials(true);
        try {
            await rejectAdminCredentialRequest(token, pendingCredentialRequest.id, {});
            setCredentialActionStatus("Credential request rejected.");
            await loadCredentialRequests();
        } catch (err) {
            setCredentialActionError(err.message || "Failed to reject request.");
        } finally {
            setIsUpdatingCredentials(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setProcessingOrderId(orderId);
        setActionMessage({ type: "", text: "" });
        try {
            await updateAdminOrderStatus(token, orderId, newStatus);
            setActionMessage({ type: "success", text: `Order ${newStatus} successfully.` });
            loadData(); // Refresh list
        } catch (err) {
            console.error(err);
            handleRequestError(err, setOrderActionError, "Unable to update order status.");
        } finally {
            setProcessingOrderId(null);
        }
    };

    const handleDownloadOrderPdf = async (order) => {
        if (isPreparingBatchPdf) return;
        if (!order?.id) return;

        setQrBatchError("");
        setQrBatchStatus("");
        setIsPreparingBatchPdf(true);

        try {
            // Fetch QRs for this specific order
            const data = await getAdminQrBatch(token, {
                orderId: order.id,
                limit: 5000
            });

            const items = Array.isArray(data) ? data : data?.items || [];

            if (!items.length) {
                setQrBatchError("No QRs found for this order.");
                setIsPreparingBatchPdf(false);
                return;
            }

            setBatchQrs(items);
            // Wait for React to render the canvases
            await new Promise((resolve) => setTimeout(resolve, 500));

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const qrSize = 40;
            const margin = 14;
            const itemsPerRow = 4;
            const rowsPerPage = 6;
            const rowSpacing = qrSize + 28;
            const spacing = (pageWidth - margin * 2 - qrSize * itemsPerRow) / Math.max(itemsPerRow - 1, 1);

            const campaignTitle = order.campaignTitle || "Campaign";
            const priceLabel = formatAmount(order.cashbackAmount);
            const perQrPrice = order.quantity ? Number(order.printCost || 0) / order.quantity : 0;
            const perQrLabel = Number.isFinite(perQrPrice) && perQrPrice > 0 ? formatAmount(perQrPrice) : "0.00";
            const printCostLabel = formatAmount(order.printCost || 0);
            const headerOffset = 54;

            const drawHeader = () => {
                doc.setFontSize(16);
                doc.text(`QR Order #${order.id.slice(0, 8)} - INR ${priceLabel}`, margin, 18);
                doc.setFontSize(10);
                doc.text(`Campaign: ${campaignTitle}`, margin, 26);
                doc.text(`Quantity: ${order.quantity}`, margin, 32);
                doc.text(`Date: ${formatDate(order.createdAt)}`, margin, 38);
                doc.text(`QR price: INR ${perQrLabel}/QR | Print cost: INR ${printCostLabel}`, margin, 44);
            };

            drawHeader();

            let skipped = 0;
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
                const yPos = headerOffset + row * rowSpacing;

                const canvas = document.getElementById(getBatchCanvasId(qr.uniqueHash));
                if (!canvas) {
                    skipped += 1;
                    return;
                }

                try {
                    const imgData = canvas.toDataURL("image/png");
                    doc.addImage(imgData, "PNG", xPos, yPos, qrSize, qrSize);

                    doc.setFontSize(8);
                    doc.text(qr.uniqueHash.slice(0, 8), xPos, yPos + qrSize + 6);
                    doc.text(`INR ${formatAmount(qr.cashbackAmount)}`, xPos, yPos + qrSize + 12);
                } catch (e) {
                    console.error("Canvas export error", e);
                    skipped++;
                }
            });

            if (skipped > 0) {
                setQrBatchStatus(`Downloaded PDF. ${skipped} QRs skipped (not rendered).`);
            } else {
                setQrBatchStatus("Order PDF downloaded successfully.");
            }

            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
            doc.save(`order-${order.id.slice(0, 8)}-${timestamp}.pdf`);

        } catch (err) {
            console.error("PDF Download Error:", err);
            setQrBatchError(err.message || "Failed to generate PDF.");
        } finally {
            setIsPreparingBatchPdf(false);
            setBatchQrs([]);
        }
    };


    const handleUpdateCampaignStatus = async (campaignId, newStatus) => {
        setIsSaving(true);
        setActionMessage({ type: "", text: "" });
        try {
            await updateAdminCampaignStatus(token, campaignId, newStatus);
            setActionMessage({ type: "success", text: `Campaign marked as ${newStatus}.` });

            // Update local state to reflect change immediately
            if (selectedCampaign && selectedCampaign.id === campaignId) {
                setSelectedCampaign({ ...selectedCampaign, status: newStatus });
                // Also update the list data seamlessly
                if (brandData) {
                    const updatedCampaigns = brandData.campaigns.map(c =>
                        c.id === campaignId ? { ...c, status: newStatus } : c
                    );
                    setBrandData({ ...brandData, campaigns: updatedCampaigns });
                }
            }

            // Refresh parent data
            loadData();
        } catch (err) {
            console.error(err);
            setActionMessage({ type: "error", text: err.message || "Failed to update campaign." });
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to get pie chart data from analytics
    const getPieData = () => {
        if (!analyticsData?.statusCounts) return [];
        return Object.entries(analyticsData.statusCounts).map(([name, value]) => ({ name, value }));
    };


    if (!vendorId && !brandId) return null;

    // Determine what name to show in header
    const headerName = brandData?.brand?.name || vendorData?.vendor?.businessName || "Account Details";
    const headerSub = vendorData?.vendor?.contactEmail || brandData?.vendor?.contactEmail || "Manage Vendor & Brand";

    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#0f0f11] rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#81cc2a] to-[#6ab024] flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                {headerName}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {headerSub}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar Tabs */}
                    <div className="w-64 border-r border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] p-4 flex flex-col gap-1 overflow-y-auto">
                        <NavButton
                            active={activeTab === "overview"}
                            onClick={() => setActiveTab("overview")}
                            icon={Activity}
                            label="Overview"
                        />
                        {vendorId && (
                            <NavButton
                                active={activeTab === "profile"}
                                onClick={() => setActiveTab("profile")}
                                icon={Store}
                                label="Vendor Profile"
                            />
                        )}
                        {brandId && (
                            <NavButton
                                active={activeTab === "brand"}
                                onClick={() => setActiveTab("brand")}
                                icon={Building2}
                                label="Brand Settings"
                            />
                        )}
                        {vendorId && (
                            <NavButton
                                active={activeTab === "financials"}
                                onClick={() => setActiveTab("financials")}
                                icon={Wallet}
                                label="Financials"
                            />
                        )}
                        {(brandId || vendorId) && (
                            <NavButton
                                active={activeTab === "campaigns"}
                                onClick={() => setActiveTab("campaigns")}
                                icon={Megaphone}
                                label="Campaigns"
                            />
                        )}
                        {vendorId && (
                            <NavButton
                                active={activeTab === "orders"}
                                onClick={() => setActiveTab("orders")}
                                icon={ShoppingBag}
                                label="Orders"
                                badge={pendingOrdersCount > 0 ? pendingOrdersCount : null}
                            />
                        )}
                    </div>

                    {/* Main Panel */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-[#0f0f11]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm animate-pulse">
                                Loading account details...
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2">
                                <AlertCircle size={32} />
                                <p>{error}</p>
                                <button onClick={loadData} className="text-xs underline text-slate-500">Try again</button>
                            </div>
                        ) : (
                            <>
                                {/* Status Message */}
                                {actionMessage.text && (
                                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm ${actionMessage.type === "error"
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                        }`}>
                                        {actionMessage.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                        {actionMessage.text}
                                    </div>
                                )}

                                {/* OVERVIEW TAB */}
                                {activeTab === "overview" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Status Cards */}
                                            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
                                                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Vendor Status</div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(vendorData?.vendor?.status || "unknown")}`}>
                                                        {vendorData?.vendor?.status || "N/A"}
                                                    </span>
                                                    <Store className="text-slate-300 dark:text-white/20" size={24} />
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
                                                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Subsription</div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className={`w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(vendorData?.subscription?.status || brandData?.subscription?.status)}`}>
                                                            {vendorData?.subscription?.status || brandData?.subscription?.status || "N/A"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 mt-1">
                                                            Exp: {formatDate(vendorData?.subscription?.endDate || brandData?.subscription?.endDate)}
                                                        </span>
                                                    </div>
                                                    <Calendar className="text-slate-300 dark:text-white/20" size={24} />
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
                                                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Wallet</div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                                        INR {formatAmount(vendorData?.wallet?.balance || 0)}
                                                    </span>
                                                    <Wallet className="text-slate-300 dark:text-white/20" size={24} />
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">Locked: INR {formatAmount(vendorData?.wallet?.lockedBalance || 0)}</div>
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <MetricItem label="Total QRs" value={vendorData?.metrics?.totalQrs || 0} />
                                            <MetricItem label="Redeemed" value={vendorData?.metrics?.redeemedQrs || 0} />
                                            <MetricItem label="Transactions" value={vendorData?.metrics?.totalTransactions || 0} />
                                            <MetricItem label="Campaigns" value={vendorData?.metrics?.campaigns || 0} />
                                        </div>

                                        {/* CHARTS SECTION */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Transaction Volume Chart */}
                                            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            <BarChartIcon size={16} className="text-[#81cc2a]" /> Transaction Volume
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recent financial activity</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 w-full min-h-[200px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={transactions.slice(0, 7).reverse()}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis
                                                                dataKey="createdAt"
                                                                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                            />
                                                            <YAxis
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                            />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                                                itemStyle={{ color: '#fff' }}
                                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                            />
                                                            <Bar dataKey="amount" fill="#81cc2a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* QR Performance Pie Chart */}
                                            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            <PieChartIcon size={16} className="text-[#81cc2a]" /> QR Performance
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Distribution of QR statuses</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 w-full min-h-[200px] relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Redeemed', value: vendorData?.metrics?.redeemedQrs || 0 },
                                                                    { name: 'Active', value: (vendorData?.metrics?.totalQrs || 0) - (vendorData?.metrics?.redeemedQrs || 0) },
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {[
                                                                    { name: 'Redeemed', value: vendorData?.metrics?.redeemedQrs || 0 },
                                                                    { name: 'Active', value: (vendorData?.metrics?.totalQrs || 0) - (vendorData?.metrics?.redeemedQrs || 0) },
                                                                ].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                                                itemStyle={{ color: '#fff' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                                {vendorData?.metrics?.totalQrs || 0}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total QRs</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center gap-4 mt-4">
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <div className="w-2 h-2 rounded-full bg-[#81cc2a]" /> Redeemed
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <div className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Active
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VENDOR PROFILE TAB */}
                                {activeTab === "profile" && vendorId && (
                                    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Briefcase size={18} className="text-[#81cc2a]" /> Business Details
                                            </h3>
                                            <div className="space-y-4">
                                                <InputGroup label="Business Name" value={vendorForm.businessName} onChange={(v) => setVendorForm({ ...vendorForm, businessName: v })} />
                                                <InputGroup label="GSTIN" value={vendorForm.gstin} onChange={(v) => setVendorForm({ ...vendorForm, gstin: v })} />
                                                <InputGroup label="Contact Phone" value={vendorForm.contactPhone} onChange={(v) => setVendorForm({ ...vendorForm, contactPhone: v })} />
                                                <InputGroup label="Contact Email" value={vendorForm.contactEmail} onChange={(v) => setVendorForm({ ...vendorForm, contactEmail: v })} type="email" />
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Address</label>
                                                    <textarea
                                                        value={vendorForm.address}
                                                        onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                                                        rows={3}
                                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#81cc2a] transition-colors resize-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                                <button
                                                    onClick={handleSaveVendor}
                                                    disabled={isSaving}
                                                    className="px-6 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSaving ? <RotateCw className="animate-spin" size={16} /> : <Save size={16} />}
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* BRAND SETTINGS TAB */}
                                {activeTab === "brand" && brandId && (
                                    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Building2 size={18} className="text-[#81cc2a]" /> Brand Identity
                                            </h3>
                                            <div className="space-y-4">
                                                <InputGroup label="Brand Name" value={brandForm.name} onChange={(v) => setBrandForm({ ...brandForm, name: v })} />
                                                <InputGroup label="Website" value={brandForm.website} onChange={(v) => setBrandForm({ ...brandForm, website: v })} />
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Brand Logo</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleBrandLogoUpload}
                                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#81cc2a] transition-colors"
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
                                                    {brandLogoUploadStatus && (
                                                        <div className="text-[11px] text-emerald-600">{brandLogoUploadStatus}</div>
                                                    )}
                                                    {brandLogoUploadError && (
                                                        <div className="text-[11px] text-rose-600">{brandLogoUploadError}</div>
                                                    )}
                                                    {isUploadingBrandLogo && (
                                                        <div className="text-[11px] text-slate-400">Uploading...</div>
                                                    )}
                                                </div>
                                                <InputGroup
                                                    label="QR price per unit (INR)"
                                                    type="number"
                                                    value={brandForm.qrPricePerUnit}
                                                    onChange={(v) => setBrandForm({ ...brandForm, qrPricePerUnit: v })}
                                                    min="0.01"
                                                    max={MAX_QR_PRICE}
                                                    step="0.01"
                                                />
                                            </div>

                                            <div className="my-6 border-t border-slate-100 dark:border-white/5" />

                                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Power size={18} className="text-[#81cc2a]" /> Account Status
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
                                                    <select
                                                        value={brandStatusForm.status}
                                                        onChange={(e) => setBrandStatusForm({ ...brandStatusForm, status: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#81cc2a] transition-colors"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive / Paused</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </div>
                                                <InputGroup label="Reason (Optional)" value={brandStatusForm.reason} onChange={(v) => setBrandStatusForm({ ...brandStatusForm, reason: v })} />
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                                <button
                                                    onClick={handleSaveBrand}
                                                    disabled={isSaving}
                                                    className="px-6 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSaving ? <RotateCw className="animate-spin" size={16} /> : <Save size={16} />}
                                                    Update Brand
                                                </button>
                                            </div>
                                            <div className="my-6 border-t border-slate-100 dark:border-white/5" />

                                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <ShieldCheck size={18} className="text-[#81cc2a]" /> Login Credentials
                                            </h3>
                                            <div className="space-y-4">
                                                {pendingCredentialRequest ? (
                                                    <div className="rounded-lg border border-amber-200/60 bg-amber-50/80 text-amber-700 px-4 py-3 text-xs">
                                                        <div className="font-semibold">Pending credential request</div>
                                                        <div className="mt-1">
                                                            Requested: {pendingCredentialRequest.requestedUsername || "Password update"}
                                                        </div>
                                                        <div className="text-[10px] opacity-80">
                                                            {formatDate(pendingCredentialRequest.createdAt)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-slate-200/60 bg-slate-50 text-slate-500 px-4 py-3 text-xs">
                                                        No pending credential request from vendor.
                                                    </div>
                                                )}
                                                {isLoadingCredentialRequests && (
                                                    <div className="text-xs text-slate-500">Loading credential requests...</div>
                                                )}

                                                <InputGroup
                                                    label="Username"
                                                    value={credentialForm.username}
                                                    onChange={(v) => setCredentialForm({ ...credentialForm, username: v })}
                                                />
                                                <InputGroup
                                                    label="New Password"
                                                    type="password"
                                                    value={credentialForm.password}
                                                    onChange={(v) => setCredentialForm({ ...credentialForm, password: v })}
                                                />
                                                <InputGroup
                                                    label="Confirm Password"
                                                    type="password"
                                                    value={credentialForm.confirmPassword}
                                                    onChange={(v) => setCredentialForm({ ...credentialForm, confirmPassword: v })}
                                                />
                                                <div className="text-[11px] text-slate-400">
                                                    Leave password blank if you only want to change the username.
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {pendingCredentialRequest && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCredentialUpdate({ useRequestDefaults: true })}
                                                            disabled={isUpdatingCredentials}
                                                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            Approve Request
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCredentialUpdate({ useRequestDefaults: false })}
                                                        disabled={isUpdatingCredentials}
                                                        className="px-4 py-2 rounded-lg bg-[#81cc2a] hover:bg-[#6ab024] text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                                    >
                                                        {pendingCredentialRequest ? "Approve with Overrides" : "Save Credentials"}
                                                    </button>
                                                    {pendingCredentialRequest && (
                                                        <button
                                                            type="button"
                                                            onClick={handleRejectCredentialRequest}
                                                            disabled={isUpdatingCredentials}
                                                            className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
                                                        >
                                                            Reject Request
                                                        </button>
                                                    )}
                                                </div>

                                                {credentialRequestError && (
                                                    <div className="text-xs text-rose-500">{credentialRequestError}</div>
                                                )}
                                                {credentialActionError && (
                                                    <div className="text-xs text-rose-500">{credentialActionError}</div>
                                                )}
                                                {credentialActionStatus && (
                                                    <div className="text-xs text-emerald-500">{credentialActionStatus}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* FINANCIALS TAB */}
                                {activeTab === "financials" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 dark:bg-white/5 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-6 py-3 font-medium">Date</th>
                                                            <th className="px-6 py-3 font-medium">Type</th>
                                                            <th className="px-6 py-3 font-medium">Description</th>
                                                            <th className="px-6 py-3 font-medium text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                        {transactions.length > 0 ? (
                                                            transactions.slice(0, 10).map(tx => (
                                                                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{formatDate(tx.createdAt)}</td>
                                                                    <td className="px-6 py-3">
                                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                                                            {tx.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">{tx.category || tx.description}</td>
                                                                    <td className={`px-6 py-3 text-right font-bold ${tx.type === 'credit' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                                        {tx.type === 'credit' ? '+' : '-'} INR {formatAmount(tx.amount)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">No transactions found</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}



                                {/* ORDERS TAB */}
                                {activeTab === "orders" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {qrBatchError && (
                                            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
                                                <AlertCircle size={16} /> {qrBatchError}
                                            </div>
                                        )}
                                        {qrBatchStatus && (
                                            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2">
                                                <CheckCircle2 size={16} /> {qrBatchStatus}
                                            </div>
                                        )}
                                        {orderActionError && (
                                            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
                                                <AlertCircle size={16} /> {orderActionError}
                                            </div>
                                        )}
                                        <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">QR Orders</h3>
                                                {pendingOrdersCount > 0 && (
                                                    <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                                                        {pendingOrdersCount} Pending
                                                    </span>
                                                )}
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 dark:bg-white/5 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-6 py-3 font-medium">Date</th>
                                                            <th className="px-6 py-3 font-medium">Campaign</th>
                                                            <th className="px-6 py-3 font-medium">Qty</th>
                                                            <th className="px-6 py-3 font-medium">Details</th>
                                                            <th className="px-6 py-3 font-medium">Cost</th>
                                                            <th className="px-6 py-3 font-medium">Status</th>
                                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                        {orders.length > 0 ? (
                                                            orders.map(order => (
                                                                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                                                        {formatDate(order.createdAt)}
                                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{order.id.substring(0, 8)}</div>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                                            {order.campaignTitle || "Unknown Campaign"}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                                                        {order.quantity} QRs
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <div className="text-xs text-slate-500">
                                                                            C.B: INR {order.cashbackAmount}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">
                                                                        INR {formatAmount(order.totalAmount || 0)}
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusClasses(order.status)}`}>
                                                                            {order.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right">
                                                                        {order.status === 'pending' && (
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                                                                                    disabled={processingOrderId === order.id}
                                                                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                                                    title="Approve"
                                                                                >
                                                                                    <CheckCircle2 size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                                                                    disabled={processingOrderId === order.id}
                                                                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                                    title="Reject"
                                                                                >
                                                                                    <AlertCircle size={16} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        {order.status !== 'pending' && (
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => handleDownloadOrderPdf(order)}
                                                                                    disabled={isPreparingBatchPdf}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                                                                                    title="Download QR PDF"
                                                                                >
                                                                                    <Download size={14} />
                                                                                    {isPreparingBatchPdf ? "..." : "PDF"}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                                                                    No orders found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CAMPAIGNS TAB */}
                                {activeTab === "campaigns" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {!selectedCampaign ? (
                                            <>
                                                {/* CAMPAIGN LIST VIEW */}
                                                {(brandData?.campaigns || vendorData?.campaigns || []).map(campaign => (
                                                    <div key={campaign.id} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{campaign.title}</div>
                                                                <div className="text-xs text-slate-500 line-clamp-1">{campaign.description}</div>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClasses(campaign.status)}`}>
                                                                {campaign.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                                            <div>
                                                                <div className="text-[10px] text-slate-400 uppercase">Budget</div>
                                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">INR {formatAmount(campaign.totalBudget)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-400 uppercase">Cashback</div>
                                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">INR {campaign.cashbackAmount}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] text-slate-400 uppercase">Ends</div>
                                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatDate(campaign.endDate)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end pt-2">
                                                            <button
                                                                onClick={() => setSelectedCampaign(campaign)}
                                                                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-[#81cc2a] hover:text-white transition-all text-xs font-bold flex items-center gap-2"
                                                            >
                                                                <Eye size={14} /> View Activity
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(brandData?.campaigns || vendorData?.campaigns || []).length === 0 && (
                                                    <div className="text-center py-10 text-slate-400">
                                                        <p>No campaigns found</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* CAMPAIGN DETAIL VIEW */
                                            <div className="space-y-6">
                                                {/* Detail Header */}
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => setSelectedCampaign(null)}
                                                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    >
                                                        <div className="p-1 rounded-full bg-slate-200 dark:bg-white/10"><X size={14} /></div> Back to List
                                                    </button>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusClasses(selectedCampaign.status)}`}>
                                                        {selectedCampaign.status}
                                                    </span>
                                                </div>

                                                {/* Main Details Card */}
                                                <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedCampaign.title}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{selectedCampaign.description}</p>

                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                                                        <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Budget</div>
                                                            <div className="text-lg font-bold text-slate-900 dark:text-white">INR {formatAmount(selectedCampaign.totalBudget)}</div>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Cashback / QR</div>
                                                            <div className="text-lg font-bold text-[#81cc2a]">INR {selectedCampaign.cashbackAmount}</div>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Start Date</div>
                                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{formatDate(selectedCampaign.startDate)}</div>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">End Date</div>
                                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{formatDate(selectedCampaign.endDate)}</div>
                                                        </div>
                                                    </div>

                                                    {/* Actions Section */}
                                                    <div className="pt-6">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Campaign Actions</h4>
                                                        <div className="flex flex-wrap gap-3">
                                                            {selectedCampaign.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'active')}
                                                                        disabled={isSaving}
                                                                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                                                    >
                                                                        <CheckCircle2 size={16} /> Approve Campaign
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'rejected')}
                                                                        disabled={isSaving}
                                                                        className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                                                                    >
                                                                        <AlertCircle size={16} /> Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            {selectedCampaign.status === 'active' && (
                                                                <button
                                                                    onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'paused')}
                                                                    disabled={isSaving}
                                                                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                                                                >
                                                                    <Power size={16} /> Pause Campaign
                                                                </button>
                                                            )}
                                                            {selectedCampaign.status === 'paused' && (
                                                                <button
                                                                    onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'active')}
                                                                    disabled={isSaving}
                                                                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                                                >
                                                                    <CheckCircle2 size={16} /> Resume Campaign
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ANALYTICS SECTION */}
                                                    {analyticsData && (
                                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                                <BarChartIcon size={16} className="text-[#81cc2a]" /> Performance Analytics
                                                            </h4>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Status Chart */}
                                                                <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
                                                                    <div className="w-full h-[180px]">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <PieChart>
                                                                                <Pie
                                                                                    data={getPieData()}
                                                                                    cx="50%"
                                                                                    cy="50%"
                                                                                    innerRadius={50}
                                                                                    outerRadius={70}
                                                                                    paddingAngle={5}
                                                                                    dataKey="value"
                                                                                >
                                                                                    {getPieData().map((entry, index) => (
                                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                                    ))}
                                                                                </Pie>
                                                                                <Tooltip
                                                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                                                                                    itemStyle={{ color: '#fff' }}
                                                                                />
                                                                            </PieChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                                                                        {getPieData().map((entry, index) => (
                                                                            <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase">
                                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                                                {entry.name}: {entry.value}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Key Metrics */}
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col justify-center">
                                                                        <div className="text-2xl font-bold text-emerald-500">{analyticsData.metrics?.redemptionRate}%</div>
                                                                        <div className="text-xs text-emerald-600/70 font-medium">Redemption Rate</div>
                                                                    </div>
                                                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col justify-center">
                                                                        <div className="text-2xl font-bold text-blue-500">{analyticsData.metrics?.uniqueRedeemers || 0}</div>
                                                                        <div className="text-xs text-blue-600/70 font-medium">Unique Users</div>
                                                                    </div>
                                                                    <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col justify-center">
                                                                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{analyticsData.metrics?.redeemedQrs || 0}</div>
                                                                        <div className="text-xs text-slate-500 font-medium">Redeemed QRs</div>
                                                                    </div>
                                                                    <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col justify-center">
                                                                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{analyticsData.metrics?.totalQrs || 0}</div>
                                                                        <div className="text-xs text-slate-500 font-medium">Total QRs Generated</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Recent Activity */}
                                                            {analyticsData.recentRedemptions?.length > 0 && (
                                                                <div className="mt-6">
                                                                    <div className="text-xs font-bold text-slate-500 uppercase mb-3">Recent Redemptions</div>
                                                                    <div className="space-y-2">
                                                                        {analyticsData.recentRedemptions.map((redemption, i) => (
                                                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-500">
                                                                                        U
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs font-bold text-slate-900 dark:text-white">User #{redemption.redeemedByUserId?.substring(0, 6) || "Unknown"}</div>
                                                                                        <div className="text-[10px] text-slate-400">{formatDate(redemption.redeemedAt)}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-xs font-bold text-[#81cc2a]">
                                                                                    + INR {redemption.cashbackAmount}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                        }
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Canvas Container for PDF Generation */}
            {batchQrs.length > 0 && (
                <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
                    {batchQrs.map((qr) => (
                        <QRCodeCanvas
                            key={qr.uniqueHash}
                            id={getBatchCanvasId(qr.uniqueHash)}
                            value={getQrValue(qr.uniqueHash)}
                            size={120}
                            level="M"
                            includeMargin
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VendorAccountManager;
