import React from 'react';
import { Eye, Sparkles } from 'lucide-react';

const CashbackRewardsCard = ({
    availableCashback = 0,
    requiredAmount = 200,
    progressPercentage = 47
}) => {
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="bg-gradient-to-br from-[#1a3d1a] via-[#1f4a1f] to-[#1a3d1a] rounded-2xl p-6 border border-[#81cc2a]/20 shadow-xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#81cc2a]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#81cc2a]/10 rounded-full blur-3xl" />

            <div className="relative">
                <div className="flex items-start justify-between mb-6">
                    <h3 className="text-white/80 text-sm font-medium">Cashback & Rewards</h3>
                    <Sparkles size={20} className="text-[#81cc2a]" />
                </div>

                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-[#81cc2a]/20 rounded flex items-center justify-center">
                            <span className="text-[#81cc2a] font-bold">₦</span>
                        </div>
                        <div className="flex-1">
                            <div className="text-sm text-white/60">Available Cashback</div>
                        </div>
                        <button className="p-1.5 rounded-full bg-[#81cc2a] hover:bg-[#6ab024] transition-colors">
                            <Eye size={14} className="text-white" />
                        </button>
                    </div>

                    <div className="text-3xl font-bold text-white mt-2">
                        {formatAmount(availableCashback)}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">
                            Spend ₦{requiredAmount - (requiredAmount * progressPercentage / 100)} more to earn ₦{requiredAmount} cashback
                        </span>
                    </div>

                    <div className="relative">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#81cc2a] to-[#9ee03a] rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <div className="absolute -top-1 left-0 right-0 flex justify-between text-xs text-white/40 mt-3">
                            <span>{progressPercentage}%</span>
                        </div>
                    </div>

                    <button className="w-full mt-4 py-2.5 bg-black/30 hover:bg-black/40 text-white text-sm font-medium rounded-xl transition-colors border border-white/10">
                        View all
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashbackRewardsCard;
