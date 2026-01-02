import React from 'react';
import { Plus, ArrowLeftRight, Download } from 'lucide-react';

const ActionButtonGroup = ({ onAddMoney, onTransferMoney, onWithdraw }) => {
    return (
        <div className="flex items-center gap-4">
            <button
                onClick={onAddMoney}
                className="flex items-center gap-2 px-6 py-3 bg-[#81cc2a] hover:bg-[#6ab024] text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#81cc2a]/30"
            >
                <Plus size={20} />
                <span>Add Money</span>
            </button>

            <button
                onClick={onTransferMoney}
                className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:bg-white/5"
            >
                <ArrowLeftRight size={20} />
                <span>Transfer Money</span>
            </button>

            <button
                onClick={onWithdraw}
                className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:bg-white/5"
            >
                <Download size={20} />
                <span>Withdraw</span>
            </button>
        </div>
    );
};

export default ActionButtonGroup;
