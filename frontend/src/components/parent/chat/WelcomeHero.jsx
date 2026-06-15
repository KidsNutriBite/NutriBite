import React from 'react';

const BotIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="9" cy="16" r="1" fill="white" stroke="none"/>
        <circle cx="15" cy="16" r="1" fill="white" stroke="none"/>
        <path d="M12 3v2" strokeWidth="2"/>
    </svg>
);

const chips = [
    { label: 'Healthy snacks', color: '#7F77DD', bg: '#F0EFFE', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a9 9 0 1 0 9 9M12 2c0 4.97 4.03 9 9 9"/>
        </svg>
    )},
    { label: 'Growth support', color: '#0D9488', bg: '#EDFDF8', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
    )},
    { label: 'Meal planning', color: '#3B82F6', bg: '#EFF6FF', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    )},
    { label: 'Fever nutrition', color: '#F97316', bg: '#FFF7ED', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
        </svg>
    )},
    { label: 'Hydration', color: '#EC4899', bg: '#FDF2F8', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
    )},
    { label: 'Immunity', color: '#22C55E', bg: '#F0FDF4', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    )},
];

const WelcomeHero = ({ onChipClick }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Large avatar */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: '#7F77DD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <BotIcon />
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: '3px',
                    right: '3px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#1D9E75',
                    border: '2.5px solid #F7F8FA'
                }} />
            </div>

            <h2 style={{
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
                lineHeight: 1.3
            }}>
                Your pediatric nutrition AI
            </h2>

            <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: '0 0 24px 0',
                lineHeight: 1.6,
                maxWidth: '320px'
            }}>
                Ask about your child's diet, growth milestones, meal ideas, and more — personalized guidance based on their profile.
            </p>

            {/* 3-column grid of 6 chips */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                width: '100%',
                maxWidth: '480px'
            }}>
                {chips.map((chip, i) => (
                    <button
                        key={i}
                        className="nutri-chip"
                        onClick={() => onChipClick(chip.label)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#FFFFFF',
                            border: '0.5px solid rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            fontFamily: 'inherit'
                        }}
                    >
                        <span style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: chip.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {chip.icon}
                        </span>
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeHero;
