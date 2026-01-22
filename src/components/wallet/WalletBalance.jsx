import React from "react";
import { BadgeCheck, LogOut, Wallet } from "lucide-react";

const formatAmount = (value) => {
    if (value === undefined || value === null) return "0.00";
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric.toFixed(2);
    return String(value);
};

const WalletBalance = ({ balance, onSignOut, isLoading }) => {
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-zinc-900 dark:to-zinc-950 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/20 dark:shadow-zinc-950/50 relative overflow-hidden group">

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                            <Wallet size={24} className="text-primary-light" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-300">vCash Balance</h2>
                            <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full w-fit mt-1">
                                <BadgeCheck size={10} />
                                Active
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onSignOut}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Sign out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="space-y-1">
                    <span className="text-3xl font-bold tracking-tight">INR</span>
                    <div className="text-5xl font-extrabold tracking-tighter tabular-nums drop-shadow-sm">
                        {isLoading ? (
                            <span className="animate-pulse opacity-50">--.--</span>
                        ) : (
                            formatAmount(balance)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletBalance;
