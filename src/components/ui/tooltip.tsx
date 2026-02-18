'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    delay?: number;
    enabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, delay = 0.2, enabled = true }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top + rect.height / 2,
                left: rect.right + 10,
            });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
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
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -5, scale: 0.95 }}
                            transition={{ duration: 0.15, delay: delay }}
                            style={{
                                position: 'fixed',
                                top: position.top,
                                left: position.left,
                                transform: 'translateY(-50%)'
                            }}
                            className="z-[999] whitespace-nowrap bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none border border-white/10"
                        >
                            {content}
                            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800" />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
