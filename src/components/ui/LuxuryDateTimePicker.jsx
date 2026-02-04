import React, { useState, useEffect, useRef } from 'react';
import '../../styles/ArticleManagement.css'; 

const LuxuryDateTimePicker = ({ value, onChange, placeholder = "Select Date & Time" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef(null);

    // Initial state from value
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState({ h: '', m: '', s: '' });

    useEffect(() => {
        if (value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setSelectedDate(`${year}-${month}-${day}`);
                setSelectedTime({
                    h: String(d.getHours()).padStart(2, '0'),
                    m: String(d.getMinutes()).padStart(2, '0'),
                    s: String(d.getSeconds()).padStart(2, '0')
                });
                setCurrentMonth(d);
            }
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const notifyChange = (date, time) => {
        if (!date) {
            onChange('');
            return;
        }
        // Construct ISO string
        const t = time || { h: '00', m: '00', s: '00' };
        const dateTimeStr = `${date}T${t.h || '00'}:${t.m || '00'}:${t.s || '00'}`;
        onChange(dateTimeStr);
    };

    const handleClear = () => {
        setSelectedDate('');
        setSelectedTime({ h: '', m: '', s: '' });
        onChange('');
    };

    const handleDateSelect = (day) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const formatted = `${year}-${month}-${dayStr}`;
        
        setSelectedDate(formatted);
        notifyChange(formatted, selectedTime);
    };

    const handleTimeChange = (field, val) => {
        const newTime = { ...selectedTime, [field]: val };
        setSelectedTime(newTime);
        if (selectedDate) {
            notifyChange(selectedDate, newTime);
        }
    };

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const renderDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="am-cal-day empty"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const year = dateToCheck.getFullYear();
            const month = String(dateToCheck.getMonth() + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayStr}`;
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div 
                    key={i} 
                    className={`am-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateSelect(i)}
                >
                    {i}
                </div>
            );
        }
        return days;
    };

    const generateOptions = (max) => {
        return Array.from({ length: max }, (_, i) => String(i).padStart(2, '0'));
    };

    const formatDisplay = () => {
        if (!selectedDate) return placeholder;
        const [y, m, d] = selectedDate.split('-');
        const t = selectedTime;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[parseInt(m) - 1] || m;
        const timeStr = (t.h || t.m || t.s) ? `${t.h || '00'}:${t.m || '00'}:${t.s || '00'}` : '00:00:00';
        return `${d} ${monthName} ${y}, ${timeStr}`;
    };

    return (
        <div className="am-calendar-container datetime-picker" ref={containerRef}>
            <button type="button" className={`am-cal-trigger ${isOpen ? 'active' : ''} ${selectedDate ? 'has-value' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="trigger-text">{formatDisplay()}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {selectedDate && (
                        <i 
                            className="fas fa-times-circle" 
                            style={{ fontSize: '0.9rem', cursor: 'pointer', color: 'var(--slate-400)', transition: 'color 0.2s' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--slate-600)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--slate-400)'}
                        ></i>
                    )}
                    <i className="fas fa-calendar-alt trigger-icon"></i>
                </div>
            </button>

            {isOpen && (
                <div className="am-calendar-dropdown wide-dropdown">
                    <div className="datetime-grid">
                        <div className="calendar-section">
                            <div className="am-cal-header">
                                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            <div className="am-cal-weekdays">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="am-cal-grid">
                                {renderDays()}
                            </div>
                        </div>

                        <div className="time-section">
                            <div className="time-header">Time (HH:MM:SS)</div>
                            <div className="time-columns">
                                <div className="time-col">
                                    <span className="col-label">Hr</span>
                                    <div className="scroll-options">
                                        {generateOptions(24).map(h => (
                                            <div 
                                                key={h} 
                                                className={`time-opt ${selectedTime.h === h ? 'selected' : ''}`}
                                                onClick={() => handleTimeChange('h', h)}
                                            >
                                                {h}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="time-col">
                                    <span className="col-label">Min</span>
                                    <div className="scroll-options">
                                        {generateOptions(60).map(m => (
                                            <div 
                                                key={m} 
                                                className={`time-opt ${selectedTime.m === m ? 'selected' : ''}`}
                                                onClick={() => handleTimeChange('m', m)}
                                            >
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="time-col">
                                    <span className="col-label">Sec</span>
                                    <div className="scroll-options">
                                        {generateOptions(60).map(s => (
                                            <div 
                                                key={s} 
                                                className={`time-opt ${selectedTime.s === s ? 'selected' : ''}`}
                                                onClick={() => handleTimeChange('s', s)}
                                            >
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LuxuryDateTimePicker;
