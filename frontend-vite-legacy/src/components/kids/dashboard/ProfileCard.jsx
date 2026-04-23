import { motion } from 'framer-motion';

const ProfileCard = ({ profile, level, currentXP }) => {
    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-50 to-transparent"></div>

            {/* Avatar Ring */}
            <div className="relative z-10 mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center text-8xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/50 to-transparent"></div>
                    {profile.avatar === 'lion' && '🦁'}
                    {profile.avatar === 'bear' && '🐻'}
                    {profile.avatar === 'rabbit' && '🐰'}
                    {profile.avatar === 'fox' && '🦊'}
                    {profile.avatar === 'cat' && '🐱'}
                    {profile.avatar === 'dog' && '🐶'}
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white font-black text-sm px-3 py-1 rounded-full border-2 border-white shadow-md">
                    Lvl {level}
                </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-1">{profile.name}</h2>
            <p className="text-blue-500 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full mb-6">Junior Chef</p>

            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">STREAK</p>
                    <p className="text-xl font-black text-orange-500">0 Days</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Level</p>
                    <p className="text-xl font-black text-blue-500">0</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
