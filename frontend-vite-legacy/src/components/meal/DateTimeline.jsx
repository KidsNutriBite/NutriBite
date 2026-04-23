import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const DateTimeline = ({ dates, selectedDate, onSelect, streak }) => {
    const scrollRef = useRef(null);

    // Scroll active date into view
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

    return (
        <div className="relative mb-8">
            {/* Streak Badge - Cleaner Look */}
            {streak > 0 && (
                <div className="absolute top-0 right-0 -mt-8 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-orange-100">
                    <span className="text-orange-500 text-lg">🔥</span>
                    <span className="text-gray-700 font-bold text-xs uppercase tracking-wide">{streak} Day Streak</span>
                </div>
            )}

            <div
                ref={scrollRef}
                className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x"
                style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
            >
                {dates.map((item, idx) => {
                    const isActive = selectedDate === item.date;
                    const isTodayDate = isToday(item.date);

                    // Status Logic - Professional & Clean
                    let bgClass = 'bg-white border border-gray-100 text-gray-400';
                    let statusDot = <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>; // Default/Empty

                    if (item.completedCount === 4) {
                        // Full Completion - Green/Success
                        bgClass = isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-green-200 text-green-700';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]"></div>;
                    } else if (item.completedCount > 0) {
                        // Partial - Indigo
                        bgClass = isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-indigo-100 text-indigo-600';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>;
                    } else if (isTodayDate) {
                        // Today Empty - Highlight border
                        bgClass = isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-2 border-indigo-100 text-indigo-400';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>;
                    } else {
                        // Missed / Past Empty - very subtle gray/red
                        bgClass = isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 border-transparent text-gray-400';
                        statusDot = isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>;
                    }

                    return (
                        <motion.button
                            key={idx}
                            data-active={isActive}
                            onClick={() => onSelect(item.date)}
                            whileTap={{ scale: 0.95 }}
                            className={`snap-center flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all relative ${bgClass} ${isActive ? 'scale-110 z-10' : 'hover:bg-gray-100'}`}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{getDayName(item.date)}</span>
                            <span className="text-xl font-bold">{getDay(item.date)}</span>

                            <div className="mt-2">
                                {statusDot}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default DateTimeline;
