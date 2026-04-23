import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title, description }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-primary/10 text-primary p-6 rounded-full mb-6">
                <span className="material-symbols-outlined text-6xl">construction</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">{title || "Coming Soon!"}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mb-8">
                {description || "We are working hard to bring this feature to life. Stay tuned for updates!"}
            </p>
            <button
                onClick={() => navigate(-1)}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
            >
                Go Back
            </button>
        </div>
    );
};

export default ComingSoon;
