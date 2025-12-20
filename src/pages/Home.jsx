import React, { useState, useEffect } from 'react';
import { Scan, Clock, Gift, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { brandCatalog } from '../data/catalog';
import FallbackImage from '../components/FallbackImage';

// Mock Data
const heroBanners = [
    { id: 1, title: "Get Upto ₹15000 on Scanning Products", subtitle: "From Double Tiger Tea", bg: "bg-teal-900", img: "https://via.placeholder.com/100" },
    { id: 2, title: "Win Gold Coins Daily", subtitle: "Scan Heritage Milk Packs", bg: "bg-blue-900", img: "https://via.placeholder.com/100" },
    { id: 3, title: "Cashback Bonanza", subtitle: "Valid on all electronic items", bg: "bg-purple-900", img: "https://via.placeholder.com/100" },
];

const stats = [
    { label: "Products Owned", value: "0", bg: "bg-orange-100", text: "text-orange-900" },
    { label: "Products Reported", value: "0", bg: "bg-red-100", text: "text-red-900" },
    { label: "vCash Earned", value: "₹ 0.00", bg: "bg-teal-100", text: "text-teal-900" },
];

const quickActions = [
    { icon: <Scan size={24} />, label: "Scan & Incentify Online", color: "bg-blue-600" },
    { icon: <Clock size={24} />, label: "Product History", color: "bg-blue-600" },
    { icon: <Gift size={24} />, label: "Rewards History", color: "bg-blue-600" },
    { icon: <FileText size={24} />, label: "Product Reports", color: "bg-blue-600" },
];

const brands = brandCatalog;

const offers = [
    { color: "bg-orange-600", amount: "₹100", brand: "RL Masala" },
    { color: "bg-gray-600", amount: "₹400", brand: "Agrawal's" },
    { color: "bg-green-600", amount: "₹20", brand: "skcop" },
];

const HeroCarousel = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % heroBanners.length);
        }, 3000); // Auto-scroll every 3 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-40 overflow-hidden rounded-xl">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 ${heroBanners[current].bg} p-5 flex items-center justify-between text-white`}
                >
                    <div className="flex-1 pr-4">
                        <div className="text-xs font-medium opacity-80 mb-1">Exclusive Offer</div>
                        <h3 className="text-lg font-bold leading-tight">{heroBanners[current].title}</h3>
                        <p className="text-xs mt-1 opacity-90">{heroBanners[current].subtitle}</p>
                        <Link
                            to="/brand-details"
                            className="mt-3 inline-flex bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-full"
                        >
                            Explore Now
                        </Link>
                    </div>
                    <FallbackImage
                        src={heroBanners[current].img}
                        alt="Offer"
                        className="w-20 h-20 rounded-lg object-cover bg-white/20"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                {heroBanners.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === current ? 'bg-white' : 'bg-white/40'}`} />
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    return (
        <div className="p-4 pb-20 space-y-6 bg-blue-50/50 min-h-full">

            {/* 1. Hero Carousel with Auto-Scroll */}
            <section>
                <HeroCarousel />
            </section>

            {/* 2. Stats Grid */}
            <section className="grid grid-cols-3 gap-3">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-3 rounded-xl flex flex-col items-center justify-center text-center h-24`}>
                        <span className={`text-xl font-bold ${stat.text}`}>{stat.value}</span>
                        <span className={`text-[10px] font-semibold ${stat.text} leading-tight mt-1`}>{stat.label.split(' ').map((w, i) => <div key={i}>{w}</div>)}</span>
                    </div>
                ))}
            </section>

            {/* 3. Quick Actions */}
            <section className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((action, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 text-center">
                            <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200`}>
                                {action.icon}
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 leading-tight">{action.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Incentify Brands Grid */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Incentify Online Brands</h2>
                    <Link
                        to="/brand-details"
                        className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5"
                    >
                        View more <ChevronRight size={12} />
                    </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {brands.map((brand, idx) => (
                        <Link
                            key={idx}
                            to={`/brand-details/${brand.id}`}
                            className="bg-white p-3 rounded-lg border border-gray-100 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <FallbackImage
                                src={brand.logo}
                                alt={brand.name}
                                className="w-10 h-10 object-contain"
                            />
                            <span className="text-[10px] font-semibold text-gray-800 text-center truncate w-full">{brand.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 5. Incentify Scan Offers (Horizontal Scroll) */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Incentify Online Scan Offers</h2>
                    <Link to="/product-info" className="text-[10px] text-blue-600 font-bold">
                        View more
                    </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory px-1">
                    {offers.map((offer, idx) => (
                        <div key={idx} className={`${offer.color} min-w-[140px] p-4 rounded-xl text-white flex flex-col justify-between h-32 relative overflow-hidden shadow-lg snap-center transform hover:scale-105 transition-transform duration-200`}>
                            <div>
                                <div className="text-[10px] font-medium opacity-90">Get Upto</div>
                                <div className="text-2xl font-bold">{offer.amount}</div>
                            </div>
                            <div className="text-xs font-bold mt-2">{offer.brand}</div>
                            <div className="bg-white text-black text-[8px] font-bold px-2 py-1 rounded inline-block self-start mt-2 shadow-sm">Avail Now</div>

                            {/* Decorative Circle */}
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/20 rounded-full blur-sm" />
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. Warranty Section */}
            <section className="bg-white p-4 rounded-xl space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                    <h2 className="text-xs font-bold text-gray-500 uppercase">Warranty</h2>
                    <span className="text-[10px] text-blue-600 font-bold">View more</span>
                </div>

                <div className="w-full bg-blue-500 text-white py-3 rounded-lg text-center font-bold text-sm shadow-md shadow-blue-200">
                    + REGISTER
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-100 text-green-700 py-2 rounded-lg text-center text-xs font-bold border border-green-200">
                        ACTIVE
                    </div>
                    <div className="bg-orange-100 text-orange-700 py-2 rounded-lg text-center text-xs font-bold border border-orange-200">
                        PENDING
                    </div>
                </div>

                {/* Promo Banner */}
                <div className="h-32 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-between p-4 text-white relative overflow-hidden">
                    <div className="z-10 max-w-[60%]">
                        <div className="text-[10px] opacity-80 uppercase tracking-widest mb-1">Trust The Brand</div>
                        <div className="text-lg font-bold leading-tight">Innovation Backed by Reliability</div>
                    </div>
                    <div className="absolute right-0 bottom-0 h-full w-1/3 bg-black/20 transform skew-x-12" />
                </div>
            </section>

        </div>
    );
};

export default Home;
