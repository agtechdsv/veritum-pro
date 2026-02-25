'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    delay?: number;
    enabled?: boolean;
    side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, delay = 0.2, enabled = true, side = 'right' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, transform: '' });
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const padding = 12;
        let finalSide = side;

        // Approximate width if not measured yet
        const tooltipWidth = contentRef.current?.offsetWidth || 200;

        // Auto-flip Right to Bottom if hitting screen edge
        if (side === 'right' && rect.right + tooltipWidth + padding > window.innerWidth) {
            finalSide = 'bottom';
        }

        if (finalSide === 'right') {
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.right + 10,
                transform: 'translateY(-50%)'
            });
        } else if (finalSide === 'bottom') {
            let left = rect.left + rect.width / 2;

            // Boundary check: Right edge
            if (left + tooltipWidth / 2 > window.innerWidth - padding) {
                left = window.innerWidth - (tooltipWidth / 2) - padding;
            }
            // Boundary check: Left edge
            if (left - tooltipWidth / 2 < padding) {
                left = tooltipWidth / 2 + padding;
            }

            setCoords({
                top: rect.bottom + 10,
                left: left,
                transform: 'translateX(-50%)'
            });
        } else if (finalSide === 'top') {
            let left = rect.left + rect.width / 2;
            if (left + tooltipWidth / 2 > window.innerWidth - padding) left = window.innerWidth - (tooltipWidth / 2) - padding;
            if (left - tooltipWidth / 2 < padding) left = tooltipWidth / 2 + padding;

            setCoords({
                top: rect.top - 10,
                left: left,
                transform: 'translate(-50%, -100%)'
            });
        } else if (finalSide === 'left') {
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.left - 10,
                transform: 'translate(-100%, -50%)'
            });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            // Re-run once after a short delay to account for measured width
            const timer = setTimeout(updatePosition, 10);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible]);

    if (!enabled) return <>{children}</>;

    return (
        <div
            ref={triggerRef}
            className="flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            ref={contentRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, delay: delay }}
                            style={{
                                position: 'fixed',
                                top: coords.top,
                                left: coords.left,
                                transform: coords.transform
                            }}
                            className="z-[999] whitespace-nowrap bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none border border-white/10"
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};


