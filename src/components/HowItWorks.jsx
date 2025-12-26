import React from 'react';
import { BadgeCheck, Scan, Gift } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            title: 'Look for Incentify Online Logo',
            description: 'Check the Incentify Online logo on products (online or offline).',
            icon: <BadgeCheck size={16} className="text-blue-600 dark:text-blue-400" />,
        },
        {
            title: 'Scratch and Scan',
            description: 'Scratch the hidden code and scan it securely.',
            icon: <Scan size={16} className="text-blue-600 dark:text-blue-400" />,
        },
        {
            title: 'Get Rewards',
            description: 'See authentication status and cashback instantly.',
            icon: <Gift size={16} className="text-blue-600 dark:text-blue-400" />,
        },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm space-y-4 transition-colors duration-300">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">How Incentify Online Works?</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {steps.map((step) => (
                    <div
                        key={step.title}
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-center space-y-3"
                    >
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-blue-100 dark:border-zinc-700 flex items-center justify-center mx-auto">
                            {step.icon}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                            {step.title}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                            {step.description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HowItWorks;
