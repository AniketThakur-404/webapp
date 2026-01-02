import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

const EarnRewardCard = ({ onLearnMore }) => {
    return (
        <div className="bg-gradient-to-br from-[#1a3d1a] via-[#1f4a1f] to-[#236d23] rounded-2xl p-8 border border-[#81cc2a]/30 shadow-xl relative overflow-hidden">
            {/* Decorative sparkle elements */}
            <div className="absolute top-6 right-6">
                <Sparkles size={32} className="text-[#ecff78] animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute top-12 right-16 w-2 h-2 bg-[#ecff78] rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="absolute top-8 right-24 w-1.5 h-1.5 bg-[#ecff78] rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#81cc2a]/10 via-transparent to-[#81cc2a]/5" />

            <div className="relative">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#81cc2a]/20 border border-[#81cc2a]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={24} className="text-[#81cc2a]" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-xl mb-1">Earn Reward</h3>
                        <p className="text-white/70 text-sm">
                            Earn ₦200 more to unlock cashback
                        </p>
                    </div>
                </div>

                <button
                    onClick={onLearnMore}
                    className="w-full sm:w-auto px-8 py-3 bg-black/40 hover:bg-black/60 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105"
                >
                    Learn More
                </button>
            </div>

        </div>
    );
};

export default EarnRewardCard;
