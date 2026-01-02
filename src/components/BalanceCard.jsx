import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const BalanceCard = ({ balance = 0, accountNumber = '*** *** **', savingsAccount = '9134******' }) => {
    const [showBalance, setShowBalance] = useState(true);

    const formatBalance = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);

    return (
        <div className="rounded-2xl p-6 border border-slate-200/70 dark:border-white/10 bg-white/90 dark:bg-gradient-to-br dark:from-[#2a2a2c] dark:via-[#1e1e20] dark:to-[#1f1f21] shadow-xl text-slate-900 dark:text-white transition-colors duration-200">
            <div className="flex items-start justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-white/60">Your Balance</h3>
                <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                >
                    {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded flex items-center justify-center text-slate-500 dark:text-white/60 text-lg font-semibold">
                        ₹
                    </div>
                    <div className="text-slate-500 dark:text-white/60 text-sm font-mono tracking-wider">
                        {showBalance ? accountNumber : '*** *** **'}
                    </div>
                    <button className="ml-auto p-1.5 rounded-full bg-[#81cc2a] hover:bg-[#6ab024] transition-colors">
                        <Eye size={14} className="text-white" />
                    </button>
                </div>

                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-4">
                    {showBalance ? formatBalance(balance) : 'N***,***.**'}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-white/10">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-white/60">Saving A/C :</span>
                    <span className="text-slate-500 dark:text-white/80 font-mono">
                        {showBalance ? savingsAccount : '****'}
                    </span>
                    <button className="p-1.5 rounded-full bg-[#81cc2a] hover:bg-[#6ab024] transition-colors">
                        <Eye size={12} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BalanceCard;
