import React, { useState } from 'react';
import {
    LayoutGrid,
    ArrowLeftRight,
    BarChart3,
    Megaphone,
    Package,
    HandCoins,
    Users,
    QrCode,
    Settings,
    ChevronDown,
    ChevronRight,
    LogOut,
    UserCircle2,
    Shield,
    Store,
    Building2,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import StarBorder from './StarBorder';
import { useTheme } from "./ThemeProvider";

const AdminSidebar = ({
    collapsed,
    activeNav,
    onNavClick,
    adminInfo,
    onLogout,
    orderNotificationCount = 0
}) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({ vendors: false });
    const { effectiveTheme } = useTheme();
    const logoSrc =
        effectiveTheme === "dark"
            ? "/dark theme incentify logo.png"
            : "/light theme incentify logo.png";

    const orderBadgeCount = Number(orderNotificationCount) || 0;
    const formatBadge = (count) => (count > 99 ? "99+" : String(count));

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'operations', label: 'Operations', icon: Wallet },
        { id: 'orders', label: 'Orders', icon: Package, badge: orderBadgeCount },
        { id: 'payouts', label: 'Payouts', icon: HandCoins },
        { id: 'users', label: 'Users', icon: Users },
        {
            id: 'vendors',
            label: 'Vendors',
            icon: Store,
            subItems: [
                { id: 'vendors-create', label: 'Create Brand', icon: Building2 },
                { id: 'vendors-active', label: 'Active Vendors', icon: ShieldCheck },
                { id: 'vendors-paused', label: 'Paused Vendors', icon: Shield },
                { id: 'subscriptions', label: 'Subscriptions', icon: Wallet },
            ]
        },
        { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
        { id: 'qrs', label: 'QR Registry', icon: QrCode },
    ];

    const settingsItems = [
        { id: 'account', label: 'Account Settings', icon: UserCircle2 },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div
            className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-white/90 dark:bg-gradient-to-b dark:from-[#0d0d0e] dark:to-[#1a1a1c] border-r border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white flex flex-col transition-all duration-300 sticky top-0`}
        >
            {/* Logo Section */}
            <div className="p-4 border-b border-slate-200/70 dark:border-white/10">
                <div className="flex items-center justify-between">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img
                                    src={logoSrc}
                                    alt="Incentify Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-slate-900 dark:text-white font-bold text-lg">Incentify</h1>
                                <p className="text-xs text-slate-500 dark:text-white/60">Admin Portal</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-12 h-12 flex items-center justify-center mx-auto p-1">
                            <img
                                src={logoSrc}
                                alt="Incentify Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-b border-slate-200/70 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                        <UserCircle2 size={24} className="text-slate-900 dark:text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-900 dark:text-white font-semibold text-sm truncate">
                                {adminInfo?.name || 'Jon Doe'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Section */}
            <div className="flex-1 overflow-y-auto py-4">
                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {!collapsed && (
                        <p className="px-3 text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">
                            Menu
                        </p>
                    )}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const hasSubItems = Array.isArray(item.subItems);
                        const badgeCount = Number(item.badge) || 0;
                        if (hasSubItems) {
                            const activeKey = String(activeNav || "");
                            const isSubActive =
                                item.subItems.some((sub) => sub.id === activeNav) ||
                                activeKey.startsWith(`${item.id}-`);
                            const isActive = activeNav === item.id || isSubActive;
                            const isOpen = openMenus[item.id] || isSubActive;
                            const showStarBorder = isActive;
                            const toggleMenu = () =>
                                setOpenMenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                            const menuContent = (
                                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                                    <Icon size={20} className={`flex-shrink-0 ${showStarBorder ? 'text-[#81cc2a]' : ''}`} />
                                    {!collapsed && (
                                        <>
                                            <span className={`text-sm font-medium ${showStarBorder ? 'text-white' : ''}`}>
                                                {item.label}
                                            </span>
                                            {isOpen ? (
                                                <ChevronDown size={16} className="ml-auto" />
                                            ) : (
                                                <ChevronRight size={16} className="ml-auto" />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                            return (
                                <div key={item.id} className="space-y-1">
                                    {showStarBorder ? (
                                        <StarBorder
                                            as="button"
                                            onClick={toggleMenu}
                                            color="#81cc2a"
                                            speed="4s"
                                            className={`w-full cursor-pointer ${collapsed ? 'justify-center mx-auto' : ''}`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            {menuContent}
                                        </StarBorder>
                                    ) : (
                                        <button
                                            onClick={toggleMenu}
                                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 ${collapsed ? 'justify-center' : ''}`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <Icon size={20} className="flex-shrink-0" />
                                            {!collapsed && (
                                                <>
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                    {isOpen ? (
                                                        <ChevronDown size={16} className="ml-auto" />
                                                    ) : (
                                                        <ChevronRight size={16} className="ml-auto" />
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {!collapsed && isOpen && (
                                        <div className="ml-6 space-y-1">
                                            {item.subItems.map((sub) => {
                                                const SubIcon = sub.icon;
                                                return (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => onNavClick(sub.id)}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${activeNav === sub.id ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                                    >
                                                        <SubIcon size={16} />
                                                        <span>{sub.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        const isActive = activeNav === item.id;
                        if (isActive) {
                            return (
                                <StarBorder
                                    key={item.id}
                                    as="button"
                                    onClick={() => onNavClick(item.id)}
                                    color="#81cc2a"
                                    speed="4s"
                                    className={`w-full cursor-pointer ${collapsed ? 'justify-center mx-auto' : ''}`}
                                >
                                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : 'px-1'}`}>
                                        <div className="relative">
                                            <Icon size={20} className="flex-shrink-0 text-[#81cc2a]" />
                                            {collapsed && badgeCount > 0 && (
                                                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
                                            )}
                                        </div>
                                        {!collapsed && <span className="text-sm font-medium text-white">{item.label}</span>}
                                        {!collapsed && badgeCount > 0 && (
                                            <span className="ml-auto rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5">
                                                {formatBadge(badgeCount)}
                                            </span>
                                        )}
                                    </div>
                                </StarBorder>
                            );
                        }
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavClick(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white ${collapsed ? 'justify-center' : ''}`}
                                title={collapsed ? item.label : ''}
                            >
                                <div className="relative">
                                    <Icon size={20} className="flex-shrink-0" />
                                    {collapsed && badgeCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
                                    )}
                                </div>
                                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                {!collapsed && badgeCount > 0 && (
                                    <span className="ml-auto rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5">
                                        {formatBadge(badgeCount)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Settings Dropdown */}
                <div className="px-3 mt-6">
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all"
                        title={collapsed ? 'Settings' : undefined}
                    >
                        <Settings size={20} className="flex-shrink-0" />
                        {!collapsed && (
                            <>
                                <span className="text-sm font-medium flex-1 text-left">Settings</span>
                                {settingsOpen ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </>
                        )}
                    </button>

                    {settingsOpen && !collapsed && (
                        <div className="mt-1 ml-3 space-y-1">
                            {settingsItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavClick(item.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all text-sm"
                                    >
                                        <Icon size={18} className="flex-shrink-0" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-200/70 dark:border-white/10">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-gray-200 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                    title={collapsed ? 'Log Out' : undefined}
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Log Out</span>}
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
