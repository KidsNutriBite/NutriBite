"use client";

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function VideoCall({ consultationId, userRole, userName, onClose }) {
    const jitsiContainerRef = useRef(null);
    const apiRef = useRef(null);

    const roomName = `NutriKidConsult-${consultationId}`;
    
    // Switching back to official meet.jit.si because it allows cross-origin framing
    const domain = 'meet.jit.si';

    useEffect(() => {
        const loadJitsi = () => {
            if (window.JitsiMeetExternalAPI) {
                initJitsi();
                return;
            }
            const script = document.createElement('script');
            script.src = `https://${domain}/external_api.js`;
            script.async = true;
            script.onload = initJitsi;
            document.body.appendChild(script);
        };

        const initJitsi = () => {
            if (!jitsiContainerRef.current || apiRef.current) return;

            apiRef.current = new window.JitsiMeetExternalAPI(domain, {
                roomName,
                parentNode: jitsiContainerRef.current,
                width: '100%',
                height: '100%',
                configOverwrite: {
                    prejoinPageEnabled: false,        // Skip pre-join lobby — go straight to call
                    disableDeepLinking: true,
                    disableInviteFunctions: true,
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    enableClosePage: false,
                    toolbarButtons: [
                        'microphone', 'camera', 'desktop',
                        'fullscreen', 'chat', 'settings',
                        'tileview', 'hangup',
                    ],
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_POWERED_BY: false,
                    DISPLAY_WELCOME_FOOTER: false,
                    HIDE_INVITE_MORE_HEADER: true,
                    APP_NAME: 'NutriKid Consultation',
                    DEFAULT_BACKGROUND: '#0f172a',
                    TOOLBAR_ALWAYS_VISIBLE: true,
                },
                userInfo: {
                    displayName: userName || (userRole === 'doctor' ? 'Doctor' : 'Parent'),
                },
            });

            apiRef.current.addEventListeners({
                readyToClose: onClose,
                videoConferenceLeft: onClose,
            });
        };

        loadJitsi();

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [consultationId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="relative w-full max-w-5xl bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                style={{ height: 'min(90vh, 720px)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#1e293b] border-b border-slate-700/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm">video_call</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">NutriKid Consultation Call</p>
                            <p className="text-slate-400 text-xs">
                                Secure video consultation
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700"
                        title="Close"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Jitsi Embed */}
                <div ref={jitsiContainerRef} className="flex-1 w-full bg-[#0f172a]" />
            </motion.div>
        </div>
    );
}
