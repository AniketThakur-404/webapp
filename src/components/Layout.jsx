import React, { useEffect, useRef } from 'react';
import { ChevronLeft, Gift, Home, User, Wallet } from 'lucide-react';
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { giftCardCategories, giftCards } from '../data/giftcards';

const Layout = ({ children }) => {
    const mainRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const giftCardsListMatch = useMatch('/gift-cards-list/:categoryId');
    const giftCardInfoMatch = useMatch('/gift-card-info/:id');
    const isHome = location.pathname === '/';

    const headerTitle = (() => {
        if (isHome) return '';
        if (giftCardInfoMatch?.params?.id) {
            const card = giftCards.find((item) => item.id === giftCardInfoMatch.params.id);
            return card?.name || 'Gift Card Info';
        }
        if (giftCardsListMatch?.params?.categoryId) {
            const category = giftCardCategories.find(
                (item) => item.id === giftCardsListMatch.params.categoryId
            );
            return category?.name || 'Gift Cards';
        }
        if (location.pathname.startsWith('/gift-cards-list')) return 'Gift Cards';
        if (location.pathname.startsWith('/gift-card-info')) return 'Gift Card Info';
        if (location.pathname.startsWith('/gift-cards')) return 'Gift Card';
        if (location.pathname.startsWith('/wallet')) return 'vCash';
        if (location.pathname.startsWith('/brand-details')) return 'Brand Details';
        if (location.pathname.startsWith('/product-info')) return 'Product Info';
        return 'Incentify Online';
    })();

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            {/* Mobile Container - limits width on desktop to look like a phone */}
            <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">

                {/* TOP HEADER */}
                <header
                    className={`bg-white px-4 py-[16px] sticky top-0 z-50 shadow-sm flex items-center ${isHome ? 'justify-between' : 'justify-start'
                        }`}
                >
                    {isHome ? (
                        <>
                            <div className="flex items-center gap-2">
                                <img
                                    src="/incentify-logo-clean.png"
                                    alt="Incentify Online"
                                    className="h-16 w-auto object-contain"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Wallet Balance Pill */}
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium shadow-md">
                                    <Wallet size={14} />
                                    <span>₹ 0.00</span>
                                </div>
                                {/* Profile Icon */}
                                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border border-gray-200">
                                    <User size={16} className="text-gray-700" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center"
                                aria-label="Go back"
                            >
                                <ChevronLeft size={18} className="text-gray-700" />
                            </button>
                            <h1 className="text-base font-semibold text-gray-800">{headerTitle}</h1>
                        </div>
                    )}
                </header>

                {/* MAIN CONTENT AREA (Scrollable) */}
                {/* MAIN CONTENT AREA (Scrollable) */}
                <main
                    ref={mainRef}
                    className="flex-1 overflow-y-auto pb-20 bg-blue-50 no-scrollbar touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {children}
                </main>

                {/* BOTTOM NAVIGATION */}
                <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 grid grid-cols-3 py-3 pb-4 z-50 safe-area-bottom px-2">
                    <NavItem to="/" icon={<Home size={20} />} label="Incentify Online" />
                    <NavItem to="/gift-cards" icon={<Gift size={20} />} label="Gift Card" />
                    <NavItem to="/wallet" icon={<Wallet size={20} />} label="vCash" />
                </nav>
            </div>
        </div>
    );
};

// Helper Component for Nav Items
const NavItem = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            className={`flex flex-col items-center gap-1 text-center ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        >
            {icon}
            <span className="text-[10px] font-medium leading-tight">{label}</span>
        </Link>
    );
};

export default Layout;
