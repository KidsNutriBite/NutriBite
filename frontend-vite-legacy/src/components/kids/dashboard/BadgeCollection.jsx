const BadgeItem = ({ icon, name, color, isLocked }) => (
    <div className="flex flex-col items-center gap-2 group">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white transition-transform group-hover:scale-105 ${isLocked ? 'bg-slate-100 text-slate-300 grayscale' : `${color} text-white`}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-[10px] font-bold uppercase text-center max-w-[80px] leading-tight ${isLocked ? 'text-slate-300' : 'text-slate-500'}`}>{name}</span>
    </div>
);

const BadgeCollection = ({ badges }) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">Badge Collection</h3>
                <button className="text-sm font-bold text-blue-500 hover:text-blue-600">See All</button>
            </div>

            <div className="grid grid-cols-2 gap-y-6 justify-items-center">
                <BadgeItem icon="forest" name="Broccoli Boss" color="bg-green-400" />
                <BadgeItem icon="water_drop" name="Water Warrior" color="bg-blue-400" />
                <BadgeItem icon="favorite" name="Heart Hero" color="bg-red-400" />
                <BadgeItem icon="restaurant_menu" name="Master Chef" color="bg-orange-300" isLocked />
                <BadgeItem icon="bolt" name="Energy King" color="bg-yellow-400" isLocked />
                <BadgeItem icon="military_tech" name="Nutri Legend" color="bg-purple-400" isLocked />
            </div>

            {/* Quote Bubble */}
            <div className="mt-8 relative bg-blue-50 p-4 rounded-2xl rounded-tl-none border border-blue-100">
                <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
                    "Hey Leo! Did you know carrots help you see in the dark?"
                </p>
                <div className="absolute -top-3 left-0 w-6 h-6 bg-blue-50 transform skew-y-12 rotate-45 border-l border-t border-blue-100"></div>
            </div>
        </div>
    );
};

export default BadgeCollection;
