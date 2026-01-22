import React, { useEffect, useRef } from 'react';
import { ChevronLeft, Gift, Home, ShoppingBag, Wallet } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { LiquidButton } from './ui/LiquidGlassButton';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { giftCardCategories, giftCards } from '../data/giftcards';
import LiquidDock from './LiquidDock';
import { useTheme } from './ThemeProvider';
import UserProfileMenu from './UserProfileMenu';

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
        if (location.pathname.startsWith('/gift-cards')) return 'Store';
        if (location.pathname.startsWith('/wallet')) return 'vCash';
        if (location.pathname.startsWith('/store')) return 'Rewards Store';
        if (location.pathname.startsWith('/vendor-dashboard')) return 'Vendor Dashboard';
        if (location.pathname.startsWith('/admin')) return 'Admin Console';
        if (location.pathname.startsWith('/brand-details')) return 'Brand Details';
        if (location.pathname.startsWith('/product-info')) return 'Product Info';
        return 'Incentify Online';
    })();

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    }, [location.pathname]);

    const { effectiveTheme } = useTheme();
    const logoSrc =
        effectiveTheme === 'dark'
            ? '/dark theme incentify logo.png'
            : '/light theme incentify logo.png';

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            {/* Mobile Container - limits width on desktop to look like a phone */}
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden transition-colors duration-300">

                {/* TOP HEADER */}
                <header
                    className={`bg-white dark:bg-zinc-950/80 backdrop-blur-md px-4 ${isHome ? 'py-3' : 'py-3'} sticky top-0 z-50 shadow-sm dark:shadow-zinc-900 border-b border-transparent dark:border-zinc-800 flex items-center transition-colors duration-300 ${isHome ? 'justify-between' : 'justify-start'
                        }`}
                >
                    {isHome ? (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="h-12 w-40 overflow-hidden flex items-center">
                                    <img
                                        src={logoSrc}
                                        alt="Incentify Online"
                                        className="h-full w-full object-contain object-left"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <ModeToggle />
                                {/* Wallet Balance Pill */}
                                <div className="bg-primary dark:bg-primary-strong text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium shadow-md">
                                    <Wallet size={14} />
                                    <span>₹ 0.00</span>
                                </div>
                                <UserProfileMenu />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between w-full h-12">
                            <div className="flex items-center gap-3">
                                <LiquidButton
                                    type="button"
                                    size="icon"
                                    onClick={() => navigate(-1)}
                                    className="rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/70 dark:border-zinc-800/70 text-gray-800 dark:text-gray-100 shadow-md"
                                    aria-label="Go back"
                                >
                                    <ChevronLeft size={18} className="text-current" />
                                </LiquidButton>
                                <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">{headerTitle}</h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <ModeToggle />
                                <UserProfileMenu />
                            </div>
                        </div>
                    )}
                </header>

                {/* MAIN CONTENT AREA (Scrollable) */}
                <main
                    ref={mainRef}
                    className="flex-1 overflow-y-auto pb-20 bg-primary/10 dark:bg-zinc-950 transition-colors duration-300 no-scrollbar touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {children}
                </main>

                {/* BOTTOM NAVIGATION */}
                <LiquidDock
                    items={[
                        { path: '/', icon: <Home size={20} />, label: 'Home' },
                        { path: '/gift-cards', icon: <Gift size={20} />, label: 'Store' },
                        { path: '/wallet', icon: <Wallet size={20} />, label: 'vCash' },
                    ]}
                />
            </div>
        </div>
    );
};


export default Layout;
