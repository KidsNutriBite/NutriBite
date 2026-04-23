import React from 'react';

const RecipeCard = ({ title, prepTime, nutrition, image, isSaved, onToggleSave, onClick }) => {
    return (
        <div onClick={onClick} className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 dark:border-slate-800 flex flex-col h-full cursor-pointer">
            <div className="relative h-48 overflow-hidden">
                {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <span className="material-symbols-outlined text-4xl">restaurant_menu</span>
                    </div>
                )}

                <div className="absolute top-3 left-3">
                    <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {prepTime}
                    </span>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                    className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm transition-colors ${isSaved ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                >
                    <span className={`material-symbols-outlined text-xl ${isSaved ? 'fill-current' : ''}`}>favorite</span>
                </button>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-3 line-clamp-2">{title}</h3>

                <div className="flex items-center gap-4 mb-5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {nutrition.iron && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Iron
                        </div>
                    )}
                    {nutrition.protein && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Protein
                        </div>
                    )}
                    {nutrition.fiber && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Fiber
                        </div>
                    )}
                </div>

                <button className="mt-auto w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    View Recipe
                </button>
            </div>
        </div>
    );
};

export default RecipeCard;
