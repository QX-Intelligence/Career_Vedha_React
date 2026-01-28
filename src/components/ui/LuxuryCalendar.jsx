import React, { useState, useEffect, useRef } from 'react';

const LuxuryCalendar = ({ selectedDate, onDateSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Format manually to avoid UTC shifts
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const formatted = `${year}-${month}-${dayStr}`;
        
        onDateSelect(formatted === selectedDate ? '' : formatted); 
        setIsOpen(false);
    };

    const getMonthName = (date) => {
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const renderDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="am-cal-day empty"></div>);
        }

        // Days
        for (let i = 1; i <= totalDays; i++) {
            const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const year = dateToCheck.getFullYear();
            const month = String(dateToCheck.getMonth() + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayStr}`;

            const isSelected = selectedDate === dateStr;
            
            // Check today
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const isToday = todayStr === dateStr;
            
            days.push(
                <div 
                    key={i} 
                    className={`am-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(i)}
                >
                    {i}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="am-calendar-container" ref={containerRef}>
            <button className={`am-cal-trigger ${selectedDate ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <i className="fas fa-calendar-alt"></i>
                <span>{selectedDate || 'Filter Date'}</span>
                {selectedDate && (
                    <span 
                        className="am-cal-clear"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDateSelect('');
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="am-calendar-dropdown">
                    <div className="am-cal-header">
                        <button onClick={handlePrevMonth}><i className="fas fa-chevron-left"></i></button>
                        <span>{getMonthName(currentMonth)}</span>
                        <button onClick={handleNextMonth}><i className="fas fa-chevron-right"></i></button>
                    </div>
                    <div className="am-cal-weekdays">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>
                    <div className="am-cal-grid">
                        {renderDays()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LuxuryCalendar;
