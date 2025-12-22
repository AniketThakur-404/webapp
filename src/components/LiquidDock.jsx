import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const DockIcon = ({ children, to, label, isActive, mouseX }) => {
    const ref = useRef(null);

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [60, 90, 60]);
    const width = useSpring(widthSync, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });

    return (
        <motion.div ref={ref} style={{ width }} className="aspect-square flex items-center justify-center">
            <Link
                to={to}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors duration-300 relative z-10 ${isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
            >
                {children}
                <span className="text-[9px] font-semibold leading-none whitespace-nowrap">{label}</span>
            </Link>
        </motion.div>
    );
};

const LiquidDock = ({ items }) => {
    const location = useLocation();
    const mouseX = useMotionValue(Infinity);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const activeIndex = items.findIndex(item => location.pathname === item.path);
    const indicatorIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex justify-center pb-6 safe-area-bottom pointer-events-none">
            <motion.div
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => {
                    mouseX.set(Infinity);
                    setHoveredIndex(null);
                }}
                className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-gray-300/50 dark:border-zinc-700/50 rounded-[24px] shadow-2xl px-5 py-3.5 pointer-events-auto"
                style={{
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1) inset'
                }}
            >
                {/* Morphing liquid background indicator */}
                {indicatorIndex >= 0 && (
                    <motion.div
                        className="absolute inset-y-3 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-[18px] border border-blue-300/50 dark:border-blue-700/50"
                        layoutId="dock-indicator"
                        initial={false}
                        animate={{
                            left: `calc(${(indicatorIndex / items.length) * 100}% + 0.75rem)`,
                            width: `calc(${100 / items.length}% - 0.75rem)`,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 25,
                            mass: 0.8,
                        }}
                        style={{
                            boxShadow: '0 2px 12px rgba(59, 130, 246, 0.4)'
                        }}
                    />
                )}

                {/* Icons container */}
                <div className="relative flex items-end gap-4">
                    {items.map((item, index) => (
                        <div
                            key={item.path}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <DockIcon
                                to={item.path}
                                label={item.label}
                                isActive={location.pathname === item.path}
                                mouseX={mouseX}
                            >
                                {item.icon}
                            </DockIcon>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default LiquidDock;
