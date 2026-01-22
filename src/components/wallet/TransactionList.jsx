import React from "react";
import { ArrowDownLeft, ArrowUpRight, Clock, History } from "lucide-react";

const formatAmount = (value) => {
    if (value === undefined || value === null) return "0.00";
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric.toFixed(2);
    return String(value);
};

const TransactionList = ({ transactions = [] }) => {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                    <History size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your latest transactions</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 -mr-2 custom-scrollbar">
                {transactions.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-2xl">
                        <Clock className="w-8 h-8 text-gray-300 dark:text-zinc-700 mb-2" />
                        <p className="text-sm font-medium text-gray-400 dark:text-zinc-500">No transactions yet</p>
                        <p className="text-xs text-gray-400/80 dark:text-zinc-600">Transactions will appear here once you start using your wallet.</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-zinc-800"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "debit"
                                        ? "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                                        : "bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400"
                                    }`}>
                                    {tx.type === "debit" ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-200 capitalize">
                                        {tx.category?.replace(/_/g, " ") || "Transaction"}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                        {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-sm font-bold ${tx.type === "debit" ? "text-gray-900 dark:text-white" : "text-green-600 dark:text-green-400"
                                }`}>
                                {tx.type === "debit" ? "-" : "+"}INR {formatAmount(tx.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TransactionList;
