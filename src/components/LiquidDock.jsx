import React, { useRef, useState, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const DockIcon = React.forwardRef(({ children, to, label, isActive, mouseX }, forwardedRef) => {
    const localRef = useRef(null);

    const distance = useTransform(mouseX, (val) => {
        const bounds = localRef.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [60, 75, 60]);
    const width = useSpring(widthSync, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });

    return (
        <motion.div
            ref={(node) => {
                localRef.current = node;
                if (typeof forwardedRef === 'function') {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    forwardedRef.current = node;
                }
            }}
            style={{ width }}
            className="h-full flex items-center justify-center"
        >
            <Link
                to={to}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors duration-300 relative z-10 ${isActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
            >
                {children}
                <span className="text-[9px] font-semibold leading-none whitespace-nowrap">{label}</span>
            </Link>
        </motion.div>
    );
});

DockIcon.displayName = 'DockIcon';

const LiquidDock = ({ items }) => {
    const location = useLocation();
    const mouseX = useMotionValue(Infinity);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const itemWrapperRefs = useRef([]);
    const innerContainerRef = useRef(null);
    const [pillPos, setPillPos] = useState({ left: 0, width: 60 });

    const activeIndex = items.findIndex(item => location.pathname === item.path);
    const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

    useLayoutEffect(() => {
        const updatePillPosition = () => {
            if (targetIndex >= 0 && itemWrapperRefs.current[targetIndex] && innerContainerRef.current) {
                const innerRect = innerContainerRef.current.getBoundingClientRect();
                const itemRect = itemWrapperRefs.current[targetIndex].getBoundingClientRect();

                setPillPos({
                    left: itemRect.left - innerRect.left,
                    width: itemRect.width,
                });
            }
        };

        updatePillPosition();

        const innerEl = innerContainerRef.current;
        const targetEl = itemWrapperRefs.current[targetIndex];
        if (!innerEl || !targetEl) return undefined;

        const resizeObserver = new ResizeObserver(updatePillPosition);
        resizeObserver.observe(innerEl);
        resizeObserver.observe(targetEl);
        window.addEventListener('resize', updatePillPosition);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updatePillPosition);
        };
    }, [targetIndex]);

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex justify-center pb-5 safe-area-bottom pointer-events-none">
            <motion.div
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => {
                    mouseX.set(Infinity);
                    setHoveredIndex(null);
                }}
                className="relative bg-gray-200/95 dark:bg-zinc-800/95 backdrop-blur-2xl rounded-full shadow-2xl pointer-events-auto"
                style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
                }}
            >
                <div className="relative h-[60px] px-3 py-2">
                    <div ref={innerContainerRef} className="relative h-full flex items-center gap-8">
                        {/* Morphing liquid background pill */}
                        <motion.div
                            className="absolute bg-white dark:bg-zinc-600/80 rounded-full shadow-lg pointer-events-none"
                            animate={pillPos}
                            transition={{
                                type: "spring",
                                stiffness: 120,
                                damping: 35,
                                mass: 1.5,
                            }}
                            style={{
                                top: 0,
                                bottom: 0,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                            }}
                        />

                        {/* Icons */}
                        {items.map((item, index) => (
                            <div
                                key={item.path}
                                className="flex-1 flex justify-center min-w-0"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <DockIcon
                                    ref={(el) => (itemWrapperRefs.current[index] = el)}
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
                </div>
            </motion.div>
        </div>
    );
};

export default LiquidDock;
