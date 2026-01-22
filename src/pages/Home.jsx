import React, { useState, useEffect } from 'react';
import { Scan, Clock, Gift, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import FallbackImage from '../components/FallbackImage';
import VideoSpotlight from '../components/VideoSpotlight';
import { LiquidButton } from '../components/ui/LiquidGlassButton';
import HowItWorks from '../components/HowItWorks';
import { getPublicHome } from '../lib/api';

// Mock Data
const heroBanners = [
    { id: 1, title: "Get Upto INR 115000 on Scanning Products", subtitle: "From Double Tiger Tea", bg: "bg-teal-900", img: "https://via.placeholder.com/100" },
    { id: 2, title: "Win Gold Coins Daily", subtitle: "Scan Heritage Milk Packs", bg: "bg-primary-strong", img: "https://via.placeholder.com/100" },
    { id: 3, title: "Cashback Bonanza", subtitle: "Valid on all electronic items", bg: "bg-purple-900", img: "https://via.placeholder.com/100" },
];

const statsTemplate = [
    { label: "Products Owned", key: "productsOwned", fallback: "0", bg: "bg-orange-100", text: "text-orange-900" },
    { label: "Products Reported", key: "productsReported", fallback: "0", bg: "bg-red-100", text: "text-red-900" },
    { label: "vCash Earned", key: "vCashEarned", fallback: "INR 0.00", bg: "bg-teal-100", text: "text-teal-900" },
];

const quickActions = [
    { icon: <Scan size={24} />, label: "Scan & Incentify Online", color: "bg-primary" },
    { icon: <Clock size={24} />, label: "Product History", color: "bg-primary" },
    { icon: <Gift size={24} />, label: "Rewards History", color: "bg-primary" },
    { icon: <FileText size={24} />, label: "Product Reports", color: "bg-primary" },
];

const offers = [
    { color: "bg-orange-600", amount: "INR 1100", brand: "RL Masala" },
    { color: "bg-gray-600", amount: "INR 1400", brand: "Agrawal's" },
    { color: "bg-green-600", amount: "INR 120", brand: "skcop" },
];

const HeroCarousel = ({ items }) => {
    const banners = Array.isArray(items) ? items : [];
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!banners.length) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 3000); // Auto-scroll every 3 seconds
        return () => clearInterval(timer);
    }, [banners.length]);

    if (!banners.length) {
        return (
            <div className="relative w-full h-40 overflow-hidden rounded-xl bg-zinc-900/80 text-white flex items-center justify-center text-xs">
                No offers available right now.
            </div>
        );
    }

    const activeBanner = banners[current] || {};

    return (
        <div className="relative w-full h-40 overflow-hidden rounded-xl">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 ${activeBanner.bg || 'bg-teal-900'} p-5 flex items-center justify-between text-white`}
                >
                    <div className="flex-1 pr-4">
                        <div className="text-xs font-medium opacity-80 mb-1">Exclusive Offer</div>
                        <h3 className="text-lg font-bold leading-tight">{activeBanner.title}</h3>

                        <p className="text-xs mt-1 opacity-90 mb-3">{activeBanner.subtitle}</p>
                        <Link to="/brand-details">
                            <LiquidButton size="sm" className="text-[10px] px-4 py-1 h-8">
                                Explore
                            </LiquidButton>
                        </Link>
                    </div>
                    <FallbackImage
                        src={activeBanner.img}
                        alt="Offer"
                        className="w-20 h-20 rounded-lg object-cover bg-white/20"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                {banners.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === current ? 'bg-white' : 'bg-white/40'}`} />
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const [homeData, setHomeData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [homeError, setHomeError] = useState("");

    useEffect(() => {
        let isMounted = true;
        const loadHome = async () => {
            setIsLoading(true);
            setHomeError("");
            try {
                const data = await getPublicHome();
                if (!isMounted) return;
                setHomeData(data);
            } catch (err) {
                if (!isMounted) return;
                setHomeError(err.message || "Unable to load home data.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadHome();
        return () => {
            isMounted = false;
        };
    }, []);

    const brands = homeData?.brands || [];
    const banners = homeData?.banners?.length ? homeData.banners : heroBanners;
    const stats = statsTemplate.map((stat) => ({
        ...stat,
        value: homeData?.stats?.[stat.key] ?? stat.fallback
    }));

    return (
        <div className="p-4 pb-20 space-y-6 bg-primary/10 dark:bg-zinc-950 min-h-full transition-colors duration-300">

            {/* 1. Hero Carousel with Auto-Scroll */}
            <section>
                <HeroCarousel items={banners} />
            </section>

            {/* 2. Quick Actions */}
            <section className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm dark:shadow-zinc-900 border border-primary/20 dark:border-zinc-800 transition-colors duration-300">
                <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((action, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 text-center">
                            <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/30`}>
                                {action.icon}
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-tight">{action.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Incentify Brands Grid */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Incentify Online Brands</h2>
                    <Link
                        to="/brand-details"
                        className="text-[10px] text-primary-strong font-bold flex items-center gap-0.5"
                    >
                        View more <ChevronRight size={12} />
                    </Link>
                </div>
                {isLoading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Loading brands...</div>
                )}
                {homeError && !isLoading && (
                    <div className="text-xs text-rose-500">{homeError}</div>
                )}
                {!isLoading && !homeError && (
                    <div className="grid grid-cols-3 gap-3">
                        {brands.map((brand) => (
                            <Link
                                key={brand.id}
                                to={`/brand-details/${brand.id}`}
                                className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <FallbackImage
                                    src={brand.logoUrl || brand.logo}
                                    alt={brand.name}
                                    className="w-10 h-10 object-contain"
                                />
                                <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 text-center truncate w-full">{brand.name}</span>
                            </Link>
                        ))}
                        {!brands.length && (
                            <div className="col-span-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                No brands available yet.
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 3.5 Video Spotlight */}
            <VideoSpotlight />

            {/* 4. Stats Grid */}
            <section className="grid grid-cols-3 gap-3">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-3 rounded-xl flex flex-col items-center justify-center text-center h-24`}>
                        <span className={`text-xl font-bold ${stat.text}`}>{stat.value}</span>
                        <span className={`text-[10px] font-semibold ${stat.text} leading-tight mt-1`}>{stat.label.split(' ').map((w, i) => <div key={i}>{w}</div>)}</span>
                    </div>
                ))}
            </section>

            {/* 5. Incentify Scan Offers (Horizontal Scroll) */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Incentify Online Scan Offers</h2>
                    <Link to="/product-info" className="text-[10px] text-primary-strong font-bold">
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

            {/* 6. How It Works */}
            <HowItWorks />

        </div>
    );
};

export default Home;
