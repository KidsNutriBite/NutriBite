import { motion } from 'framer-motion';

const QuestItem = ({ icon, title, xp, isCompleted, colorClass }) => {
    return (
        <div className={`group flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${isCompleted ? 'bg-slate-50 border-transparent opacity-80' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isCompleted ? 'bg-slate-300' : colorClass}`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <div>
                    <h4 className={`font-bold text-lg ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{title}</h4>
                    <span className={`text-xs font-bold uppercase ${isCompleted ? 'text-slate-400' : 'text-slate-400'}`}>{isCompleted ? 'Completed' : `+${xp} XP`}</span>
                </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'border-slate-200'}`}>
                {isCompleted && <span className="material-symbols-outlined text-white text-lg font-bold">check</span>}
            </div>
        </div>
    );
};

const DailyQuests = ({ quests }) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-800">Daily Quests</h3>
                <span className="text-sm font-bold text-blue-500">2 of 4 Done</span>
            </div>

            <div className="space-y-4">
                <QuestItem
                    icon="egg_alt"
                    title="Log Breakfast"
                    xp="50"
                    isCompleted={quests?.breakfast}
                    colorClass="bg-blue-500"
                />
                <QuestItem
                    icon="water_drop"
                    title="Drink 4 Glasses of Water"
                    xp="100"
                    isCompleted={quests?.water >= 4}
                    colorClass="bg-blue-400"
                />
                <QuestItem
                    icon="nutrition"
                    title="Try a Green Snack"
                    xp="150"
                    isCompleted={false}
                    colorClass="bg-green-500"
                />
                <QuestItem
                    icon="restaurant"
                    title="Help Cook Dinner"
                    xp="300"
                    isCompleted={false}
                    colorClass="bg-orange-500"
                />
            </div>
        </div>
    );
};

export default DailyQuests;
