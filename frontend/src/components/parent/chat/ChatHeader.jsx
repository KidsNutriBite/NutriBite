import React from 'react';

const BotIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="9" cy="16" r="1" fill="white" stroke="none"/>
        <circle cx="15" cy="16" r="1" fill="white" stroke="none"/>
        <path d="M12 3v2" strokeWidth="2"/>
    </svg>
);

const MenuIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const ChatHeader = ({ onBack }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: '#FFFFFF',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            flexShrink: 0
        }}>
            {/* Left: back + avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px', display: 'flex' }}
                        aria-label="Go back"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                )}
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#7F77DD',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <BotIcon size={18} />
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: '#1D9E75',
                        border: '2px solid white'
                    }} />
                </div>
            </div>

            {/* Center: title + badge */}
            <div style={{ textAlign: 'center', flex: 1, paddingLeft: onBack ? '0' : '0' }}>
                <div style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.3'
                }}>
                    NutriGuide AI
                </div>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '3px',
                    background: '#ECFDF5',
                    border: '0.5px solid #A7F3D0',
                    borderRadius: '99px',
                    padding: '2px 8px'
                }}>
                    <ShieldCheckIcon />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#1D9E75' }}>Safety checked</span>
                </div>
            </div>

            {/* Right: menu */}
            <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }} aria-label="More options">
                <MenuIcon />
            </button>
        </div>
    );
};

export default ChatHeader;
