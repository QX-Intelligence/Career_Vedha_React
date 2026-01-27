import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

const TooltipManager = () => {
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0
    });

    // Use a ref to track the current target for mousemove efficiency
    const currentTargetRef = useRef(null);

    useEffect(() => {
        const handleMouseOver = (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (!target) return;

            const text = target.getAttribute('data-tooltip');
            if (!text) return;

            currentTargetRef.current = target;
            updatePosition(target, text);
        };

        const handleMouseOut = (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                setTooltip(prev => ({ ...prev, visible: false }));
                currentTargetRef.current = null;
            }
        };

        const updatePosition = (target, text) => {
            const rect = target.getBoundingClientRect();

            // Calculate center top position by default
            let x = rect.left + (rect.width / 2);
            let y = rect.top - 8; // 8px spacing

            setTooltip({
                visible: true,
                text,
                x,
                y,
                position: 'top' // Can expand logic for auto-placement later
            });
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        // Optional: Scroll listener to hide tooltip on scroll
        const handleScroll = () => {
            if (currentTargetRef.current) {
                setTooltip(prev => ({ ...prev, visible: false }));
            }
        };
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    if (!tooltip.visible) return null;

    // Create a portal to document.body to ensure no z-index clipping
    return createPortal(
        <div
            className={`custom-tooltip-portal ${tooltip.visible ? 'visible' : ''}`}
            style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
                transform: `translateX(-50%) translateY(-100%)` // Shift up specifically for top placement
            }}
        >
            {tooltip.text}
        </div>,
        document.body
    );
};

export default TooltipManager;
