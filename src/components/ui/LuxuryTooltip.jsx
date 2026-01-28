import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LuxuryTooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;

            let top = 0;
            let left = 0;
            const gap = 10; // Space between element and tooltip

            switch (position) {
                case 'top':
                    top = rect.top + scrollY - gap;
                    left = rect.left + scrollX + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + scrollY + gap;
                    left = rect.left + scrollX + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + scrollY + rect.height / 2;
                    left = rect.left + scrollX - gap;
                    break;
                case 'right':
                    top = rect.top + scrollY + rect.height / 2;
                    left = rect.right + scrollX + gap;
                    break;
                default:
                    top = rect.top + scrollY - gap;
                    left = rect.left + scrollX + rect.width / 2;
            }

            setCoords({ top, left });
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
        setIsVisible(true);
    };

    const initial = {
        opacity: 0,
        scale: 0.9,
        x: '-50%', // Default for top/bottom
        y: position === 'top' ? 10 : position === 'bottom' ? -10 : '-50%'
    };

    // Adjust transforms based on position
    if (position === 'left') {
        initial.x = 10;
        initial.y = '-50%';
    } else if (position === 'right') {
        initial.x = -10;
        initial.y = '-50%';
    }

    const animate = {
        opacity: 1,
        scale: 1,
        x: position === 'left' || position === 'right' ? (position === 'left' ? '-100%' : '0%') : '-50%',
        y: position === 'top' ? '-100%' : position === 'bottom' ? '0%' : '-50%'
    };

    const exit = {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.1 }
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="relative inline-flex items-center justify-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={handleMouseEnter}
                onBlur={() => setIsVisible(false)}
            >
                {children}
            </div>
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            initial={initial}
                            animate={animate}
                            exit={exit}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{
                                position: 'absolute',
                                top: coords.top,
                                left: coords.left,
                                zIndex: 9999, // High z-index to overlay everything
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap'
                            }}
                            className="luxury-tooltip-portal"
                        >
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#f8fafc',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                letterSpacing: '0.02em',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                                textTransform: 'uppercase'
                            }}>
                                {content}
                                {/* Tiny Arrow - simplified for portal positioning */}
                                <div style={{
                                    position: 'absolute',
                                    width: '6px',
                                    height: '6px',
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    borderRight: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
                                    transform: 'rotate(45deg)',
                                    left: '50%',
                                    marginLeft: '-3px',
                                    bottom: position === 'top' ? '-3px' : 'auto',
                                    top: position === 'bottom' ? '-3px' : 'auto',
                                    display: position === 'left' || position === 'right' ? 'none' : 'block' // Hide arrow for side tooltips for now to simplify
                                }} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default LuxuryTooltip;
