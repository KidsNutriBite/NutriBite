
import { motion, AnimatePresence } from 'framer-motion';

const KidsModal = ({ isOpen, onClose, title, message, icon = "info" }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-primary/20 text-center"
                    >
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-5xl text-primary">{icon}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{title}</h3>
                        <p className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-8">{message}</p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-transform active:scale-95"
                        >
                            GOT IT!
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default KidsModal;
