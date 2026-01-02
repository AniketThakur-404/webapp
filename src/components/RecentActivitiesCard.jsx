import React from 'react';
import { ShoppingCart, Send, Zap, Receipt } from 'lucide-react';

const ActivityIcon = ({ type }) => {
    const iconMap = {
        purchase: ShoppingCart,
        transfer: Send,
        bill: Zap,
        cashback: Receipt,
    };

    const Icon = iconMap[type] || Receipt;

    return (
        <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-slate-600 dark:text-white/80" />
        </div>
    );
};

const RecentActivitiesCard = ({ activities = [] }) => {
    const defaultActivities = [
        { id: 1, type: 'purchase', title: 'Grocery Shopping at X12 Mart', amount: -15000.0, date: 'Nov 16, 2024', status: 'Completed' },
        { id: 2, type: 'bill', title: 'Airtime Purchase (MTN)', amount: -1000.0, date: 'Nov 14, 2024', status: 'Completed' },
        { id: 3, type: 'bill', title: 'Electricity Bill (PHCN)', amount: -10500.0, date: 'Nov 14, 2024', status: 'Failed' },
        { id: 4, type: 'transfer', title: 'Transfer to Jane Doe', amount: -20000.0, date: 'Nov 13, 2024', status: 'Pending' },
        { id: 5, type: 'cashback', title: 'Cashback Earned (Promo)', amount: 500.0, date: 'Nov 12, 2024', status: 'Completed' },
    ];

    const displayActivities = activities.length > 0 ? activities : defaultActivities;

    const formatAmount = (amount) => {
        const formatted = new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));

        return amount < 0 ? `-₦${formatted}` : `+₦${formatted}`;
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'completed') return 'text-emerald-400';
        if (statusLower === 'pending') return 'text-amber-400';
        if (statusLower === 'failed') return 'text-rose-400';
        return 'text-gray-400';
    };

    const containerClass =
        'rounded-2xl p-6 border border-slate-200/60 bg-white/90 shadow-xl text-slate-900 dark:bg-gradient-to-br dark:from-[#1d1c1f] dark:via-[#151518] dark:to-[#0f0f12] dark:border-white/10 dark:text-white transition-colors';

    return (
        <div className={containerClass}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Recent Activities</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {displayActivities.map((activity, index) => (
                    <div
                        key={activity.id || index}
                        className="flex items-start gap-3 pb-4 border-b border-slate-200/60 dark:border-white/10 last:border-0 last:pb-0"
                    >
                        <ActivityIcon type={activity.type} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {activity.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 dark:text-white/40">{activity.date}</span>
                                <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                                    {activity.status}
                                </span>
                            </div>
                        </div>
                        <div className={`text-sm font-semibold ${activity.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatAmount(activity.amount)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivitiesCard;
