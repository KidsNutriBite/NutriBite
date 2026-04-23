import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DoctorResources = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const resources = [
        { id: 1, title: 'Early Childhood Nutrition Guidelines 2024', category: 'Guidelines', type: 'PDF', size: '2.4 MB', icon: 'description', color: 'blue' },
        { id: 2, title: 'Managing Pediatric Iron Deficiency', category: 'Medical Study', type: 'Web', size: '-', icon: 'language', color: 'green' },
        { id: 3, title: 'Sample Meal Plans for Finicky Eaters', category: 'Handouts', type: 'DOCX', size: '1.1 MB', icon: 'article', color: 'orange' },
        { id: 4, title: 'Common Food Allergies in Toddlers', category: 'Reference', type: 'PDF', size: '3.8 MB', icon: 'warning', color: 'red' },
    ];

    const filteredResources = useMemo(() => {
        return resources.filter(res =>
            res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const handleViewFile = (title) => {
        toast.success(`Opening ${title}...`);
    };

    const handleUpload = () => {
        toast.error('Cloud resource sharing is coming soon!');
    };

    return (
        <div className="space-y-8">
            {/* Header Section with Dark Mode Support */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Medical Resources</h1>
                    <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Access and share clinical guidelines and patient handouts.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search materials..."
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full shadow-sm text-gray-900 dark:text-white transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredResources.length > 0 ? (
                        filteredResources.map((res, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                key={res.id}
                                className="group bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex items-start gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${res.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                        res.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' :
                                            res.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' :
                                                'bg-red-50 dark:bg-red-900/20 text-red-600'
                                        }`}>
                                        <span className="material-symbols-outlined text-2xl">{res.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">{res.category}</span>
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-400 text-[10px] font-bold rounded">{res.type}</span>
                                        </div>
                                        <h3 className="font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-tight mb-2">{res.title}</h3>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{res.size}</span>
                                            <button
                                                onClick={() => handleViewFile(res.title)}
                                                className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider group-hover:gap-2 transition-all"
                                            >
                                                View File
                                                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-4">search_off</span>
                            <p className="text-gray-500 dark:text-slate-400 font-bold">No resources found matching your search</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Share Section with Dark Mode Support */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-slate-800 rounded-[2.5rem] p-8 border border-white dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-primary shadow-sm text-3xl shrink-0">
                        ☁️
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="font-black text-gray-900 dark:text-white text-xl">Share with Parents</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Upload your own resources to share with your connected parents.</p>
                    </div>
                </div>
                <button
                    onClick={handleUpload}
                    className="bg-white dark:bg-slate-900 text-primary dark:text-blue-400 font-black px-8 py-4 rounded-2xl shadow-sm border border-primary/10 dark:border-slate-700 hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                    <span className="material-symbols-outlined">upload</span>
                    Upload Content
                </button>
            </div>
        </div>
    );
};

export default DoctorResources;
