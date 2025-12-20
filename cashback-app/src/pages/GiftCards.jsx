import React from 'react';
import { Search, ShoppingBag, Coffee, Truck, Smartphone, Watch, Gift } from 'lucide-react';

const categories = [
    { name: "Shopping", icon: <ShoppingBag size={20} className="text-yellow-600" />, bg: "bg-yellow-100" },
    { name: "Grocery", icon: <Coffee size={20} className="text-green-600" />, bg: "bg-green-100" },
    { name: "Travel", icon: <Truck size={20} className="text-blue-600" />, bg: "bg-blue-100" },
    { name: "Electronics", icon: <Smartphone size={20} className="text-purple-600" />, bg: "bg-purple-100" },
    { name: "Accessories", icon: <Watch size={20} className="text-pink-600" />, bg: "bg-pink-100" },
    { name: "Others", icon: <Gift size={20} className="text-gray-600" />, bg: "bg-gray-100" },
];

const offers = [
    { name: "Flipkart", discount: "2.5%", color: "bg-blue-500" },
    { name: "Swiggy", discount: "4.5%", color: "bg-orange-500" },
    { name: "BigBasket", discount: "2%", color: "bg-green-600" },
    { name: "Myntra", discount: "3.5%", color: "bg-pink-500" },
    { name: "Uber", discount: "2%", color: "bg-black" },
];

const GiftCards = () => {
    return (
        <div className="bg-blue-50 min-h-full pb-10">

            {/* Search Bar */}
            <div className="bg-white p-4 pb-2 sticky top-0 z-40">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for gift cards..."
                        className="w-full bg-gray-100 rounded-full py-3 px-5 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-700"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                        <Search size={18} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar mask-gradient">
                <button className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shadow-md shadow-blue-200">Store</button>
                <button className="bg-white text-gray-600 px-5 py-1.5 rounded-full text-sm font-medium border border-gray-200 whitespace-nowrap hover:bg-gray-50">My Vouchers</button>
                <button className="bg-white text-gray-600 px-5 py-1.5 rounded-full text-sm font-medium border border-gray-200 whitespace-nowrap hover:bg-gray-50">History</button>
            </div>

            {/* Categories Grid */}
            <div className="px-4 py-2">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Categories</h3>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className={`w-12 h-12 ${cat.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                                {cat.icon}
                            </div>
                            <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Best Sellers List */}
            <div className="bg-white rounded-t-[2rem] p-5 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] min-h-[300px]">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-sm font-bold text-gray-800">Best Sellers</h3>
                    <span className="text-[10px] text-blue-500 font-bold cursor-pointer">View All</span>
                </div>

                <div className="space-y-4">
                    {offers.map((offer, idx) => (
                        <div key={idx} className="flex items-center gap-4 border-b border-gray-50 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
                            <div className={`w-12 h-12 ${offer.color} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                                {offer.name[0]}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 text-sm">{offer.name}</h4>
                                <p className="text-green-600 text-xs font-bold flex items-center gap-1 mt-0.5">
                                    Get Flat {offer.discount} Cashback
                                </p>
                            </div>
                            <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold">Buy</button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default GiftCards;
