import { Link } from 'react-router-dom';

const SimpleNavbar = () => {
    return (
        <header className="fixed top-0 z-50 w-full px-4 py-4 md:px-20 lg:px-40 pointer-events-none">
            <nav className="glass-nav inline-flex items-center rounded-full border border-white/20 px-6 py-3 shadow-lg dark:border-white/10 bg-white/80 backdrop-blur-xl pointer-events-auto">
                <Link to="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/40">
                        <span className="material-symbols-outlined">nutrition</span>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">NutriKid</h2>
                </Link>
            </nav>
        </header>
    );
};

export default SimpleNavbar;
