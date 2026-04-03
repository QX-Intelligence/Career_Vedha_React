import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LuxuryTooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible, position]);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            
            // Safety check: if width/height are 0, it might be hidden or moving
            if (rect.width === 0 || rect.height === 0) return;

            let top = 0;
            let left = 0;
            const gap = 12; // Slightly more gap for clarity

            switch (position) {
                case 'top':
                    top = rect.top - gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - gap;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + gap;
                    break;
                default:
                    top = rect.top - gap;
                    left = rect.left + rect.width / 2;
            }

            setCoords({ top, left });
        }
    };

    const handleMouseEnter = () => {
        // Double update to ensure we catch any layout shifts
        updatePosition();
        setTimeout(updatePosition, 10);
        setIsVisible(true);
    };

    const initial = {
        opacity: 0,
        scale: 0.95,
        x: '-50%',
        y: position === 'top' ? 5 : position === 'bottom' ? -5 : '-50%'
    };

    // Adjust transforms based on position
    if (position === 'left') { initial.x = 5; initial.y = '-50%'; }
    else if (position === 'right') { initial.x = -5; initial.y = '-50%'; }

    const animate = {
        opacity: 1,
        scale: 1,
        x: position === 'left' || position === 'right' ? (position === 'left' ? '-100%' : '0%') : '-50%',
        y: position === 'top' ? '-100%' : position === 'bottom' ? '0%' : '-50%'
    };

    const exit = {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.1 }
    };

    return (
        <>
            <div
                ref={triggerRef}
                style={{ display: 'inline-block', width: 'fit-content', verticalAlign: 'middle' }}
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
                                position: 'fixed',
                                top: coords.top,
                                left: coords.left,
                                zIndex: 99999, // Extra high
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap'
                            }}
                            className="luxury-tooltip-portal"
                        >
                            <div style={{
                                background: '#0f172a',
                                border: '1px solid var(--cv-primary)',
                                color: '#f8fafc',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                letterSpacing: '0.01em',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                                textTransform: 'uppercase'
                            }}>
                                {content}
                                {/* Tiny Arrow - simplified for portal positioning */}
                                <div style={{
                                    position: 'absolute',
                                    width: '8px',
                                    height: '8px',
                                    background: '#0f172a',
                                    borderRight: '1px solid var(--cv-primary)',
                                    borderBottom: '1px solid var(--cv-primary)',
                                    transform: 'rotate(45deg)',
                                    left: '50%',
                                    marginLeft: '-4px',
                                    bottom: position === 'top' ? '-4px' : 'auto',
                                    top: position === 'bottom' ? '-4px' : 'auto',
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
