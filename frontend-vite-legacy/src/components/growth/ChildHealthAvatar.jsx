import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const ChildHealthAvatar = ({ age, gender, riskStatus, height, bmi }) => {
    // Determine the general lifecycle stage based on age
    const stage = useMemo(() => {
        if (age < 2) return 'infant';
        if (age < 5) return 'toddler';
        if (age < 12) return 'child';
        return 'teen';
    }, [age]);

    // Avatar config based on health status and stage
    const avatarConfig = useMemo(() => {
        const config = {
            emoji: '👦',
            bgClass: 'bg-blue-100',
            ringClass: 'ring-blue-300',
            animation: { y: [0, -10, 0] },
            duration: 2,
            label: 'Healthy Growth'
        };

        if (gender === 'female') config.emoji = '👧';
        if (stage === 'infant') config.emoji = '👶';
        if (stage === 'teen') config.emoji = gender === 'female' ? '👩' : '👨';

        switch (riskStatus) {
            case 'underweight':
                config.bgClass = 'bg-orange-100';
                config.ringClass = 'ring-orange-300';
                config.animation = { y: [0, -3, 0], scale: [1, 0.95, 1] }; // Low energy animation
                config.duration = 4;
                config.label = 'Needs Energy';
                break;
            case 'overweight':
            case 'obese':
                config.bgClass = 'bg-red-100';
                config.ringClass = 'ring-red-300';
                config.animation = { y: [0, -5, 0], scale: [1, 1.05, 1] }; // Heavy animation
                config.duration = 3;
                config.label = 'Active Mode Recommended';
                break;
            default: // normal
                config.bgClass = 'bg-green-100';
                config.ringClass = 'ring-green-400';
                config.animation = { y: [0, -15, 0], rotate: [0, 5, -5, 0] }; // Bouncy healthy
                config.duration = 1.5;
                config.label = 'Strong & Healthy';
                break;
        }

        return config;
    }, [stage, gender, riskStatus]);

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative">
                <motion.div
                    animate={avatarConfig.animation}
                    transition={{
                        duration: avatarConfig.duration,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center text-6xl md:text-8xl shadow-xl ring-4 ${avatarConfig.ringClass} ${avatarConfig.bgClass}`}
                >
                    {avatarConfig.emoji}
                </motion.div>

                {/* Health Sparkles for healthy status */}
                {riskStatus === 'normal' && (
                    <>
                        <motion.div animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute top-0 right-0 text-2xl">✨</motion.div>
                        <motion.div animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} className="absolute bottom-4 -left-4 text-xl">🌟</motion.div>
                    </>
                )}
                
                {/* Low energy Zzz for underweight */}
                {riskStatus === 'underweight' && (
                    <motion.div animate={{ y: [0, -20], opacity: [1, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 right-0 text-xl text-orange-400 font-bold">Zzz</motion.div>
                )}
            </div>

            <div className="text-center">
                <RiskBadge risk={riskStatus} />
                <p className="mt-2 text-gray-500 font-medium text-sm">{avatarConfig.label}</p>
                <div className="flex gap-4 justify-center mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>H: {height}cm</span>
                    <span>BMI: {bmi}</span>
                </div>
            </div>
        </div>
    );
};

// Assuming RiskBadge is small component, we add a simplified local version if it's not imported directly by parent
const RiskBadge = ({ risk }) => {
    let color = 'bg-green-100 text-green-700';
    let text = 'Normal';
    
    if (risk === 'underweight') { color = 'bg-orange-100 text-orange-700'; text = 'Underweight'; }
    if (risk === 'overweight') { color = 'bg-yellow-100 text-yellow-700'; text = 'Overweight'; }
    if (risk === 'obese') { color = 'bg-red-100 text-red-700'; text = 'Obese'; }

    return <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${color}`}>{text}</span>;
}

export default ChildHealthAvatar;
