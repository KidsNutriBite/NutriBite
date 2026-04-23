
import { Outlet } from 'react-router-dom';

const KidsLayout = () => {
    return (
        <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-900 dark:to-slate-800 font-display transition-colors duration-500 overflow-hidden">
            {/* Decorative Background Elements (Global for Kids Mode) */}
            <div className="absolute top-1/4 left-1/4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-9xl text-green-400 rotate-12">nutrition</span>
            </div>
            <div className="absolute bottom-1/3 right-1/4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-8xl text-orange-400 -rotate-45">skillet</span>
            </div>
            <div className="absolute top-1/2 left-10 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-9xl text-primary animate-pulse">star</span>
            </div>

            <Outlet />
        </div>
    );
};

export default KidsLayout;
