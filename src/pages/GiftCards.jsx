import React, { useEffect, useMemo, useState } from 'react';
import { Coffee, Gift, Search, ShoppingBag, Smartphone, Truck, Watch } from 'lucide-react';
import { Link } from 'react-router-dom';
import FallbackImage from '../components/FallbackImage';
import HowItWorks from '../components/HowItWorks';
import { getPublicGiftCardCategories, getPublicGiftCards, getPublicStoreData } from '../lib/api';

const categoryIconMap = {
    shopping: ShoppingBag,
    grocery: Coffee,
    travel: Truck,
    electronics: Smartphone,
    accessories: Watch,
    others: Gift
};

const GiftCards = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('vouchers');
    const [giftCardCategories, setGiftCardCategories] = useState([]);
    const [giftCards, setGiftCards] = useState([]);
    const [storeData, setStoreData] = useState({ categories: [], products: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const [categoriesData, cardsData, storeDataResponse] = await Promise.all([
                    getPublicGiftCardCategories(),
                    getPublicGiftCards(),
                    getPublicStoreData()
                ]);

                if (!isMounted) return;
                setGiftCardCategories(Array.isArray(categoriesData) ? categoriesData : []);
                setGiftCards(Array.isArray(cardsData) ? cardsData : []);
                setStoreData({
                    categories: storeDataResponse?.categories || [],
                    products: storeDataResponse?.products || []
                });
            } catch (err) {
                if (!isMounted) return;
                setLoadError(err.message || 'Unable to load gift cards.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    const storeCategories = storeData.categories || [];
    const storeProducts = storeData.products || [];

    const filteredProducts = useMemo(() => activeCategory === 'All'
        ? storeProducts
        : storeProducts.filter(item => item.category === activeCategory), [activeCategory, storeProducts]);

    return (
        <div className="bg-primary/10 dark:bg-zinc-950 min-h-full pb-10 transition-colors duration-300">

            {/* Search Bar */}
            <div className="bg-white dark:bg-zinc-950 p-4 pb-2 sticky top-0 z-40 transition-colors duration-300">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for gift cards..."
                        className="w-full bg-gray-100 dark:bg-zinc-900 rounded-full py-3 px-5 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all text-gray-700 dark:text-gray-200 border border-transparent dark:border-zinc-800"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                        <Search size={18} />
                    </div>
                </div>
            </div>

            {loadError && (
                <div className="px-4 pt-2 text-xs text-rose-500">{loadError}</div>
            )}

            {/* Tabs */}
            {/* Tabs - Segmented Control */}
            <div className="px-4 mt-4">
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-1 rounded-xl flex items-center relative gap-1">
                    <button
                        onClick={() => setActiveTab('vouchers')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'vouchers'
                            ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        Vouchers
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'products'
                            ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        Products
                    </button>
                </div>
            </div>

            {activeTab === 'vouchers' && (
                <>
                    {/* Categories Grid */}
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Categories</h3>
                        {isLoading && (
                            <div className="text-xs text-gray-500">Loading categories...</div>
                        )}
                        {!isLoading && giftCardCategories.length === 0 && (
                            <div className="text-xs text-gray-500">No categories available yet.</div>
                        )}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {giftCardCategories.map((cat) => {
                                const Icon = categoryIconMap[cat.iconId || cat.id] || Gift;
                                return (
                                    <Link
                                        key={cat.id}
                                        to={`/gift-cards-list/${cat.id}`}
                                        className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <div className={`w-12 h-12 ${cat.bg || 'bg-gray-100'} rounded-2xl flex items-center justify-center shadow-sm`}>
                                            <Icon size={20} className={cat.iconColor || 'text-gray-600'} />
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
                            <Link to="/gift-cards-list" className="text-[10px] text-primary-strong font-bold cursor-pointer">
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
                                        <span className="text-primary-strong dark:text-primary bg-primary/10 dark:bg-primary-strong/30 px-3 py-1 rounded-full text-xs font-bold">Buy</span>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'products' && (
                /* Product Redemption Shelves */
                <div className="mt-4 px-4 transition-colors duration-300 pb-20">
                    <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
                        {['All', ...storeCategories].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filteredProducts.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col items-center p-6 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800"
                            >
                                <div className="h-24 w-24 mb-4 flex items-center justify-center">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-contain drop-shadow-lg" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 text-center">{item.name}</h4>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 text-center">{item.points} points</p>

                                <button className="w-full py-3 rounded-xl bg-primary hover:bg-primary-strong text-white font-bold text-sm transition-colors shadow-lg shadow-primary/20">
                                    Redeem
                                </button>
                            </div>
                        ))}
                        {!isLoading && !filteredProducts.length && (
                            <div className="text-xs text-gray-500">No products available yet.</div>
                        )}
                    </div>
                </div>
            )}


            {/* How It Works */}
            <div className="px-4 mt-4 pb-8">
                <HowItWorks />
            </div>

        </div>
    );
};

export default GiftCards;
