const RecentWins = () => {
    return (
        <div className="bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100">
            <h3 className="text-xl font-black text-slate-800 mb-6">Recent Wins</h3>

            <div className="relative space-y-8 pl-4">
                {/* Timeline Line */}
                <div className="absolute top-2 bottom-2 left-[27px] w-0.5 bg-blue-200"></div>

                {/* Win 1 */}
                <div className="relative flex items-start gap-4">
                    <div className="relative z-10 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm mt-1.5 shrink-0"></div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex-1">
                        <p className="text-sm text-slate-800">You earned <span className="font-bold text-blue-500">+150 XP</span></p>
                        <p className="text-xs text-slate-500 mt-1">Finished your "Grown by the Sun" daily challenge.</p>
                    </div>
                </div>

                {/* Win 2 */}
                <div className="relative flex items-start gap-4">
                    <div className="relative z-10 w-4 h-4 rounded-full bg-orange-500 border-4 border-white shadow-sm mt-1.5 shrink-0"></div>
                    <div className="bg-orange-50 p-4 rounded-2xl shadow-sm border border-orange-100 flex-1">
                        <p className="text-sm text-slate-800">New Badge! <span className="font-bold text-orange-500">Broccoli Boss</span></p>
                        <p className="text-xs text-slate-500 mt-1">You ate green veggies 5 days in a row!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecentWins;
