import React from 'react';
import { motion } from 'framer-motion';

const DoctorAppointments = () => {
    const appointments = [
        { id: 1, name: 'Zayan Khan', type: 'Follow-up', date: 'Oct 24, 2023', time: '10:30 AM', status: 'Confirmed', avatar: 'https://avatar.iran.liara.run/public/1' },
        { id: 2, name: 'Ayesha Ahmed', type: 'Initial Consultation', date: 'Oct 24, 2023', time: '11:45 AM', status: 'Pending', avatar: 'https://avatar.iran.liara.run/public/2' },
        { id: 3, name: 'Rayan Ahmed', type: 'Nutrition Review', date: 'Oct 25, 2023', time: '09:00 AM', status: 'Confirmed', avatar: 'https://avatar.iran.liara.run/public/3' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Appointments</h1>
                    <p className="text-gray-500 font-medium text-sm">Manage your patient schedule and consultations.</p>
                </div>
                <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-600 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    New Slot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">today</span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Today</p>
                        <p className="text-lg font-black text-gray-900">4 Sessions</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Completed</p>
                        <p className="text-lg font-black text-gray-900">12 This Week</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Requests</p>
                        <p className="text-lg font-black text-gray-900">3 Pending</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <h2 className="font-bold text-gray-900">Upcoming Schedule</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {appointments.map((apt, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={apt.id}
                            className="p-6 hover:bg-gray-50 transition-all flex flex-col md:flex-row items-center gap-6"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <img src={apt.avatar} alt="" className="w-12 h-12 rounded-full ring-2 ring-gray-100" />
                                <div>
                                    <p className="font-black text-gray-900 underline decoration-primary/20 hover:decoration-primary cursor-pointer transition-all">{apt.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{apt.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-center md:text-left">
                                    <p className="text-sm font-bold text-gray-900">{apt.date}</p>
                                    <p className="text-xs text-gray-400 font-medium">{apt.time}</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {apt.status}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-all">
                                    <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DoctorAppointments;
