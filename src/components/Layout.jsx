import React, { useEffect, useRef } from 'react';
import { Home, Gift, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const mainRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            {/* Mobile Container - limits width on desktop to look like a phone */}
            <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">

                {/* TOP HEADER */}
                <header className="bg-white px-4 py-[16px] sticky top-0 z-50 shadow-sm flex justify-between items-center">
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
                </header>

                {/* MAIN CONTENT AREA (Scrollable) */}
                <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 bg-blue-50">
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
