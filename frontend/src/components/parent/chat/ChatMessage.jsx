import React, { useState } from 'react';

const BotIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="9" cy="16" r="1" fill="white" stroke="none"/>
        <circle cx="15" cy="16" r="1" fill="white" stroke="none"/>
    </svg>
);

const parseMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: '6px' }} />;
        if (t.startsWith('### ')) return <p key={i} style={{ fontWeight: 700, fontSize: '13px', color: '#7F77DD', margin: '8px 0 2px' }}>{t.slice(4)}</p>;
        if (t.startsWith('## ')) return <p key={i} style={{ fontWeight: 700, fontSize: '14px', margin: '10px 0 4px' }}>{t.slice(3)}</p>;
        if (t === '---') return <hr key={i} style={{ border: 'none', borderTop: '0.5px solid rgba(0,0,0,0.1)', margin: '8px 0' }} />;
        if (t.startsWith('- ') || t.startsWith('* ')) {
            const content = t.slice(2);
            return (
                <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ color: '#7F77DD', marginTop: '1px' }}>•</span>
                    <span style={{ flex: 1 }}>{parseBold(content)}</span>
                </div>
            );
        }
        if (/^\d+\.\s/.test(t)) {
            const num = t.match(/^(\d+)\./)[1];
            const content = t.replace(/^\d+\.\s/, '');
            return (
                <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ color: '#7F77DD', fontWeight: 600, fontSize: '11px', minWidth: '14px' }}>{num}.</span>
                    <span style={{ flex: 1 }}>{parseBold(content)}</span>
                </div>
            );
        }
        return <p key={i} style={{ margin: '0 0 4px', lineHeight: 1.6 }}>{parseBold(line)}</p>;
    });
};

const parseBold = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
            ? <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>
            : p
    );
};

const DetailsAccordion = ({ content }) => {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ marginTop: '10px', borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: '8px' }}>
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 600, color: '#7F77DD',
                        display: 'flex', alignItems: 'center', gap: '4px', padding: 0,
                        fontFamily: 'inherit'
                    }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    View detailed explanation
                </button>
            ) : (
                <div style={{ background: '#F7F8FA', borderRadius: '8px', padding: '12px', marginTop: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Detailed analysis</span>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, fontFamily: 'inherit' }}>✕</button>
                    </div>
                    {parseMarkdown(content)}
                </div>
            )}
        </div>
    );
};

const ChatMessage = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const parts = msg.text?.split('|||DETAILED|||') ?? [msg.text];
    const shortText = parts[0];
    const detailText = parts[1];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '80%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isUser ? '#EEEDFE' : '#7F77DD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {isUser ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
                        </svg>
                    ) : <BotIcon />}
                </div>

                {/* Bubble */}
                <div style={{
                    padding: '10px 14px',
                    borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: isUser ? '#7F77DD' : '#FFFFFF',
                    border: isUser ? 'none' : '0.5px solid rgba(0,0,0,0.1)',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                    maxWidth: '100%'
                }}>
                    {isUser ? (
                        <span>{msg.text}</span>
                    ) : (
                        <>
                            {parseMarkdown(shortText)}
                            {detailText && <DetailsAccordion content={detailText} />}
                        </>
                    )}
                </div>
            </div>

            {/* Timestamp */}
            <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                paddingLeft: isUser ? '0' : '36px',
                paddingRight: isUser ? '36px' : '0'
            }}>
                {msg.time}
            </span>
        </div>
    );
};

export default ChatMessage;
