import React from 'react';
import { HandCoins, Package, Receipt, Send, ShoppingCart, Zap } from 'lucide-react';

const ActivityIcon = ({ type }) => {
  const iconMap = {
    order: Package,
    purchase: ShoppingCart,
    withdrawal: HandCoins,
    transfer: Send,
    bill: Zap,
    cashback: Receipt,
    notification: Zap,
  };

  const Icon = iconMap[type] || Receipt;

  return (
    <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon size={18} className="text-slate-600 dark:text-white/80" />
    </div>
  );
};

const RecentActivitiesCard = ({
  title = 'Recent Activities',
  activities = [],
  emptyMessage = 'No recent activity yet.',
  onItemClick
}) => {
  const displayActivities = Array.isArray(activities) ? activities : [];

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return null;
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) return String(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(numeric));
    return `INR ${formatted}`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'completed') return 'text-emerald-400';
    if (statusLower === 'processed') return 'text-emerald-400';
    if (statusLower === 'shipped') return 'text-emerald-400';
    if (statusLower === 'approved') return 'text-emerald-400';
    if (statusLower === 'paid') return 'text-amber-400';
    if (statusLower === 'pending') return 'text-amber-400';
    if (statusLower === 'rejected') return 'text-rose-400';
    if (statusLower === 'failed') return 'text-rose-400';
    return 'text-gray-400';
  };

  const containerClass =
    'rounded-2xl p-6 border border-slate-200/60 bg-white/90 shadow-xl text-slate-900 dark:bg-gradient-to-br dark:from-[#1d1c1f] dark:via-[#151518] dark:to-[#0f0f12] dark:border-white/10 dark:text-white transition-colors';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        {displayActivities.length > 0 && (
          <span className="text-xs text-slate-400">{displayActivities.length} items</span>
        )}
      </div>
      {displayActivities.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-white/50">{emptyMessage}</div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {displayActivities.map((activity, index) => {
            const amountLabel = activity.amountLabel || formatAmount(activity.amount);
            const statusLabel = activity.statusLabel || activity.status;
            const isClickable = typeof onItemClick === 'function' && !activity.disabled;

            return (
              <button
                key={activity.id || index}
                type="button"
                onClick={isClickable ? () => onItemClick(activity) : undefined}
                disabled={!isClickable}
                className={`w-full text-left flex items-start gap-3 pb-4 border-b border-slate-200/60 dark:border-white/10 last:border-0 last:pb-0 ${isClickable
                  ? 'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/10 rounded-lg px-2 -mx-2 transition-colors'
                  : 'cursor-default'}`}
                aria-label={activity.title}
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  {activity.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-white/50 truncate mt-1">
                      {activity.subtitle}
                    </p>
                  )}
                  {activity.meta && (
                    <p className="text-xs text-slate-500 dark:text-white/40 truncate mt-1">
                      {activity.meta}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {activity.date || "-"}
                    </span>
                    {statusLabel && (
                      <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                </div>
                {amountLabel && (
                  <div className="text-sm font-semibold text-slate-900 dark:text-white/80">
                    {amountLabel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivitiesCard;
