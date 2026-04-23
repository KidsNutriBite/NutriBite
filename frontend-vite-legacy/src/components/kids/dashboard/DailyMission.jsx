import { motion } from 'framer-motion';

const DailyMission = ({ onAccept }) => {
    return (
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/4 translate-y-1/4 blur-lg"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                        Today's Mission
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                        The Rainbow Crunch Challenge!
                    </h2>
                    <p className="text-orange-50 text-lg font-medium leading-relaxed mb-6 max-w-lg">
                        Eat 3 different colored vegetables today to earn the "Veggie Voyager" badge and 200 XP!
                    </p>
                    <button
                        onClick={onAccept}
                        className="bg-white text-orange-500 font-black text-lg px-8 py-3 rounded-2xl shadow-lg hover:bg-orange-50 transition-transform hover:-translate-y-1 active:translate-y-0"
                    >
                        I'm Ready!
                    </button>
                </div>

                {/* Icon Circle */}
                <div className="shrink-0 relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <span className="material-symbols-outlined text-6xl md:text-7xl text-white">eco</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyMission;
