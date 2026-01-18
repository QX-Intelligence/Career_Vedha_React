import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';


const CustomSelect = ({
    options = [],
    value = "",
    onChange,
    placeholder = "Select an option...",
    label = "",
    icon = "fas fa-chevron-down",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        if (disabled) return;
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt =>
        (typeof opt === 'string' ? opt === value : opt.value === value)
    );

    const displayLabel = selectedOption
        ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
        : placeholder;

    return (
        <div className={`custom-select-container ${disabled ? 'disabled' : ''}`} ref={containerRef}>
            {label && <label className="custom-select-label">{label}</label>}
            <div
                className={`custom-select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="trigger-text">{displayLabel}</span>
                <i className={`${icon} toggle-icon`}></i>
            </div>

            {isOpen && (
                <div className="custom-select-dropdown slide-in-top">
                    {options.length > 0 ? (
                        <div className="options-list">
                            {options.map((option, idx) => {
                                const optValue = typeof option === 'string' ? option : option.value;
                                const optLabel = typeof option === 'string' ? option : option.label;
                                const isSelected = optValue === value;

                                return (
                                    <div
                                        key={idx}
                                        className={`option-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelect(optValue)}
                                    >
                                        {optLabel}
                                        {isSelected && <i className="fas fa-check"></i>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-options">No options available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
