import React from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { giftCardCategories, giftCards } from '../data/giftcards';
import FallbackImage from '../components/FallbackImage';
import HowItWorks from '../components/HowItWorks';

const GiftCards = () => {
    return (
        <div className="bg-blue-50 dark:bg-zinc-950 min-h-full pb-10 transition-colors duration-300">

            {/* Search Bar */}
            <div className="bg-white dark:bg-zinc-950 p-4 pb-2 sticky top-0 z-40 transition-colors duration-300">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for gift cards..."
                        className="w-full bg-gray-100 dark:bg-zinc-900 rounded-full py-3 px-5 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-700 dark:text-gray-200 border border-transparent dark:border-zinc-800"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                        <Search size={18} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar mask-gradient">
                <button className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shadow-md shadow-blue-200 dark:shadow-none">Store</button>
                <button className="bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 px-5 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-zinc-800 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">My Vouchers</button>
                <button className="bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 px-5 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-zinc-800 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">History</button>
            </div>

            {/* Categories Grid */}
            <div className="px-4 py-2">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Categories</h3>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {giftCardCategories.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={idx}
                                to={`/gift-cards-list/${cat.id}`}
                                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <div className={`w-12 h-12 ${cat.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                                    <Icon size={20} className={cat.iconColor} />
                                </div>
                                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{cat.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Best Sellers List */}
            <div className="bg-white dark:bg-zinc-900 rounded-t-[2rem] p-5 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] dark:shadow-zinc-950 min-h-[300px] transition-colors duration-300">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Best Sellers</h3>
                    <Link to="/gift-cards-list" className="text-[10px] text-blue-500 font-bold cursor-pointer">
                        View All
                    </Link>
                </div>

                <div className="space-y-4">
                    {giftCards
                        .filter((card) => card.featured)
                        .map((card) => (
                            <Link
                                key={card.id}
                                to={`/gift-card-info/${card.id}`}
                                className="flex items-center gap-4 border-b border-gray-50 dark:border-zinc-800 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 px-2 -mx-2 rounded-lg transition-colors"
                            >
                                <FallbackImage
                                    src={card.logo}
                                    alt={card.name}
                                    className="w-12 h-12 rounded-xl object-cover bg-gray-50 dark:bg-zinc-800 shadow-sm"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{card.name}</h4>
                                    <p className="text-green-600 dark:text-green-500 text-xs font-bold flex items-center gap-1 mt-0.5">
                                        Get Flat {card.discount} Instant Discount
                                    </p>
                                </div>
                                <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full text-xs font-bold">Buy</span>
                            </Link>
                        ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="px-4 mt-4 pb-8">
                <HowItWorks />
            </div>

        </div>
    );
};

export default GiftCards;
