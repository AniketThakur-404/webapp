import React from 'react';
import {
    Smartphone,
    Wifi,
    Zap,
    Globe,
    Receipt,
    Dices,
    Tv,
    MoreHorizontal
} from 'lucide-react';

const ServiceIconGrid = ({ onServiceClick }) => {
    const services = [
        { id: 'airtime', label: 'Airtime', icon: Smartphone },
        { id: 'data', label: 'Data', icon: Wifi },
        { id: 'electricity', label: 'Electricity', icon: Zap },
        { id: 'internet', label: 'Internet', icon: Globe },
        { id: 'bills', label: 'Bills', icon: Receipt },
        { id: 'betting', label: 'Betting', icon: Dices },
        { id: 'tv', label: 'TV', icon: Tv },
        { id: 'other', label: 'Other Services', icon: MoreHorizontal },
    ];

    return (
        <div className="grid grid-cols-4 gap-4">
            {services.map((service) => {
                const Icon = service.icon;

                return (
                    <button
                        key={service.id}
                        onClick={() => onServiceClick?.(service.id)}
                        className="group bg-gradient-to-br from-[#2a2a2c] to-[#1f1f21] hover:from-[#81cc2a]/10 hover:to-[#6ab024]/5 border border-white/5 hover:border-[#81cc2a]/30 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#81cc2a]/10"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-white/5 group-hover:bg-[#81cc2a]/20 border border-white/10 group-hover:border-[#81cc2a]/30 rounded-lg flex items-center justify-center transition-all">
                                <Icon size={24} className="text-white/60 group-hover:text-[#81cc2a] transition-colors" />
                            </div>
                            <span className="text-white/70 group-hover:text-white text-sm font-medium transition-colors">
                                {service.label}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ServiceIconGrid;
