"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DateTimeline = ({ dates, selectedDate, onSelect, streak, history = [] }) => {
    const scrollRef = useRef(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Current viewing month in calendar modal (Defaults to selected date's month or current month)
    const [viewDate, setViewDate] = useState(() => {
        return selectedDate ? new Date(selectedDate) : new Date();
    });

    // Scroll active date into view in horizontal strip
    useEffect(() => {
        if (scrollRef.current) {
            const activeEl = scrollRef.current.querySelector('[data-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedDate]);

    // Format helpers
    const getDay = (d) => new Date(d).getDate();
    const getDayName = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = (d) => new Date().toDateString() === new Date(d).toDateString();

    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString(new Date());

    // Month Navigation logic
    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        if (nextMonth <= currentMonthStart) {
            setViewDate(nextMonth);
        }
    };

    const isCurrentMonthOrFuture = () => {
        const now = new Date();
        return viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth();
    };

    // Calendar Days Generator for viewDate month
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Padding for previous month days
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ isPadding: true, key: `pad-${i}` });
        }

        // Days in current month
        for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
            const dateObj = new Date(year, month, dayNum);
            const dateStr = getLocalDateString(dateObj);
            const isFuture = dateStr > todayStr;
            const isTodayDate = dateStr === todayStr;

            // Lookup meal log status in history
            const log = history.find(h => (h.date || '').split('T')[0] === dateStr);
            const completedCount = log ? (log.completedMealsCount || 0) : 0;

            let status = 'none';
            if (completedCount >= 4) {
                status = 'full'; // 🟢 Green (All meals logged)
            } else if (completedCount > 0) {
                status = 'partial'; // 🟠 Orange (Partial meals logged)
            } else if (!isFuture && dateStr < todayStr) {
                status = 'missed'; // 🔴 Red (Missed / 0 meals logged on past date)
            }

            days.push({
                isPadding: false,
                dayNum,
                dateStr,
                isFuture,
                isToday: isTodayDate,
                isSelected: selectedDate === dateStr,
                completedCount,
                status,
                key: dateStr
            });
        }

        return days;
    }, [viewDate, history, selectedDate, todayStr]);

    return (
        <div className="relative mb-8">
            {/* Top Bar with Open Calendar Button & Streaks */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (selectedDate) setViewDate(new Date(selectedDate));
                            setIsCalendarOpen(true);
                        }}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all cursor-pointer group"
                    >
                        <span className="material-symbols-outlined text-primary text-base group-hover:scale-110 transition-transform">
                            calendar_month
                        </span>
                        <span>Open Calendar</span>
                    </button>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                        (Click to jump to any past date)
                    </span>
                </div>

                {/* Streak Badge */}
                {streak > 0 && (
                    <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-100 dark:border-orange-900/40 shadow-sm">
                        <span>🔥</span>
                        <span>{streak} Day Meal Streak</span>
                    </div>
                )}
            </div>

            {/* Horizontal Timeline Strip */}
            <div
                ref={scrollRef}
                className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x"
                style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
            >
                {dates.map((item, idx) => {
                    const isActive = selectedDate === item.date;
                    const isTodayDate = isToday(item.date);

                    // Status Logic
                    let bgClass = 'bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700 text-slate-400';
                    let statusDot = <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>;

                    if (item.completedCount >= 4) {
                        bgClass = isActive ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-slate-850 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>;
                    } else if (item.completedCount > 0) {
                        bgClass = isActive ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-slate-850 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>;
                    } else if (isTodayDate) {
                        bgClass = isActive ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-slate-850 border-2 border-primary/40 text-primary';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>;
                    } else {
                        bgClass = isActive ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-500';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>;
                    }

                    return (
                        <motion.button
                            key={idx}
                            data-active={isActive}
                            onClick={() => onSelect(item.date)}
                            whileTap={{ scale: 0.95 }}
                            className={`snap-center flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${bgClass} ${isActive ? 'scale-105 z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{getDayName(item.date)}</span>
                            <span className="text-xl font-black">{getDay(item.date)}</span>

                            <div className="mt-2">
                                {statusDot}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Interactive Full Calendar Modal */}
            <AnimatePresence>
                {isCalendarOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">event_available</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">Select any past date to view or log meals</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="size-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="Previous Month"
                                    >
                                        <span className="material-symbols-outlined text-base">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={handleNextMonth}
                                        disabled={isCurrentMonthOrFuture()}
                                        className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
                                            isCurrentMonthOrFuture()
                                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                                        }`}
                                        title="Next Month (Disabled for Future)"
                                    >
                                        <span className="material-symbols-outlined text-base">chevron_right</span>
                                    </button>
                                    <button
                                        onClick={() => setIsCalendarOpen(false)}
                                        className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ml-1 transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* 7-Day Day Header */}
                            <div className="grid grid-cols-7 gap-1 text-center mt-4 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                    <div key={i} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {calendarDays.map((item) => {
                                    if (item.isPadding) {
                                        return <div key={item.key} className="h-12" />;
                                    }

                                    const { dayNum, dateStr, isFuture, isToday, isSelected, status } = item;

                                    if (isFuture) {
                                        return (
                                            <div
                                                key={item.key}
                                                className="h-12 flex flex-col items-center justify-center rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700 opacity-50 cursor-not-allowed select-none"
                                            >
                                                <span className="text-xs font-medium">{dayNum}</span>
                                            </div>
                                        );
                                    }

                                    let dotColor = 'bg-slate-200 dark:bg-slate-700';
                                    if (status === 'full') dotColor = 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]';
                                    else if (status === 'partial') dotColor = 'bg-amber-500';
                                    else if (status === 'missed') dotColor = 'bg-rose-500';

                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => {
                                                onSelect(dateStr);
                                                setIsCalendarOpen(false);
                                            }}
                                            className={`h-12 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
                                                isSelected
                                                    ? 'bg-primary text-white shadow-md shadow-primary/30 font-bold scale-105 z-10'
                                                    : isToday
                                                    ? 'bg-primary/10 text-primary border border-primary/30 font-bold hover:bg-primary/20'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            <span className="text-xs">{dayNum}</span>
                                            <div className="mt-1 flex items-center justify-center">
                                                <div className={`size-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Status Legend */}
                            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-emerald-500" />
                                    <span>All Logged (4+ meals)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-amber-500" />
                                    <span>Partial (1-3 meals)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-rose-500" />
                                    <span>Missed Log</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DateTimeline;
