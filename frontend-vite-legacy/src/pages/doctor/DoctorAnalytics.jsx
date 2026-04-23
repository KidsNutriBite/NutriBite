import React from 'react';
import { motion } from 'framer-motion';

const DoctorAnalytics = () => {
    const stats = [
        { label: 'Total Patients', value: '1,284', trend: '+12%', icon: 'group', color: 'blue' },
        { label: 'Avg Health Score', value: '78/100', trend: '-2%', icon: 'favorite', color: 'red' },
        { label: 'Successful Goals', value: '84%', trend: '+5%', icon: 'trending_up', color: 'green' },
    ];

    return (
        <div className="space-y-8 text-gray-800">
            <div>
                <h1 className="text-3xl font-black text-gray-900">Practice Analytics</h1>
                <p className="text-gray-500 font-medium text-sm">Monitor patient trends and demographic insights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        key={stat.label}
                        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white shadow-sm ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                    stat.color === 'red' ? 'bg-red-50 text-red-600' :
                                        'bg-green-50 text-green-600'
                                }`}>
                                <span className="material-symbols-outlined">{stat.icon}</span>
                            </div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-black text-gray-900">{stat.value}</span>
                                <span className={`text-xs font-bold mb-1 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-400'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-6xl">{stat.icon}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="bg-gray-50/50 absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-primary animate-pulse mb-6">
                            <span className="material-symbols-outlined text-4xl">bar_chart</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg mb-2">Age Distribution Chart</h4>
                        <p className="text-sm text-gray-400 font-medium max-w-xs">Data visualization of patient demographics is being aggregated from current active profiles.</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="bg-gray-50/50 absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 animate-pulse mb-6">
                            <span className="material-symbols-outlined text-4xl">show_chart</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg mb-2">Nutrient Trends Over Time</h4>
                        <p className="text-sm text-gray-400 font-medium max-w-xs">Aggregated nutrient deficiency reports for the current patient cohort.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6 inline-block">Pro Insight</span>
                    <h3 className="text-2xl font-black mb-4">Iron Levels are lower in 12-24 month age group across your practice.</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                        Based on aggregated meal logs, 42% of your patients in this demographic are consistently missing recommended iron targets.
                        Consider reviewing diet plans for these specific profiles.
                    </p>
                    <button className="bg-white text-slate-900 font-black px-8 py-4 rounded-2xl hover:bg-primary hover:text-white transition-all">
                        View Detailed Report
                    </button>
                </div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-20 hidden md:block">
                    <span className="material-symbols-outlined text-[10rem]">science</span>
                </div>
            </div>
        </div>
    );
};

export default DoctorAnalytics;
