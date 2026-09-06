"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function VideoCall({ consultationId, userRole, userName, onClose }) {
    const jitsiContainerRef = useRef(null);
    const apiRef = useRef(null);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const callStartTimeRef = useRef(null);
    const hasSavedRef = useRef(false);

    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryDone, setSummaryDone] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const domain = 'meet.jit.si';
    const roomName = `NutriKidConsult-${consultationId}`;

    // ── Speech Recognition ─────────────────────────────────────────
    const startTranscription = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        try {
            const recognition = new SR();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcriptRef.current += event.results[i][0].transcript + ' ';
                    }
                }
            };

            recognition.onerror = (e) => {
                if (e.error !== 'no-speech') console.warn('Speech recognition error:', e.error);
            };

            recognition.onend = () => {
                if (recognitionRef.current === recognition && !summaryDone) {
                    try { recognition.start(); } catch (_) {}
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (err) {
            console.warn('Could not start speech recognition:', err.message);
        }
    }, [summaryDone]);

    const stopTranscription = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            try { recognitionRef.current.stop(); } catch (_) {}
            recognitionRef.current = null;
        }
    }, []);

    // ── End Call → Generate AI Summary ────────────────────────────
    const handleCallEnd = useCallback(() => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        
        stopTranscription();

        const durationMs = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
        const transcript = transcriptRef.current.trim();

        // Pass the transcript back to the parent component to handle saving
        onClose(transcript, durationMinutes);
    }, [onClose, stopTranscription]);

    // ── Init Jitsi ─────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const initJitsi = () => {
            if (!mounted || !jitsiContainerRef.current || apiRef.current) return;

            try {
                apiRef.current = new window.JitsiMeetExternalAPI(domain, {
                    roomName,
                    parentNode: jitsiContainerRef.current,
                    width: '100%',
                    height: '100%',
                    configOverwrite: {
                        // Keep prejoin page ON so user can sign in with Google
                        prejoinPageEnabled: true,
                        disableDeepLinking: true,
                        disableInviteFunctions: false,
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        enableClosePage: false,
                        enableLobbyChat: false,
                        toolbarButtons: [
                            'microphone', 'camera', 'desktop',
                            'fullscreen', 'chat', 'tileview', 'hangup',
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
                    videoConferenceJoined: () => {
                        callStartTimeRef.current = Date.now();
                        startTranscription();
                    }
                    // Removed readyToClose and videoConferenceLeft to prevent Jitsi from automatically ending the session on network drops or pauses.
                    // The session will now strictly ONLY save when the user clicks the explicit "Close" button on the top right.
                });

            } catch (err) {
                console.error('Jitsi init error:', err);
                if (mounted) setLoadError(true);
            }
        };

        const loadScript = () => {
            if (window.JitsiMeetExternalAPI) {
                initJitsi();
                return;
            }
            // Remove any old script from a different domain to avoid conflicts
            const old = document.querySelector('script[src*="external_api.js"]');
            if (old) old.remove();

            const script = document.createElement('script');
            script.src = `https://${domain}/external_api.js`;
            script.async = true;
            script.onload = () => { if (mounted) initJitsi(); };
            script.onerror = () => { if (mounted) setLoadError(true); };
            document.body.appendChild(script);
        };

        loadScript();

        return () => {
            mounted = false;
            stopTranscription();
            if (apiRef.current) {
                try { apiRef.current.dispose(); } catch (_) {}
                apiRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                            <p className="text-slate-400 text-xs flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                                Sign in with Google inside the call panel · AI transcript active
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCallEnd}
                        className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700"
                        title="End Call & Generate Summary"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Jitsi Embed — flex-1 fills remaining height */}
                <div
                    ref={jitsiContainerRef}
                    className="w-full flex-1 bg-[#0f172a]"
                    style={{ minHeight: '500px' }}
                />

                {/* Load Error State */}
                {loadError && (
                    <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center gap-4 z-10 px-6 text-center">
                        <span className="material-symbols-outlined text-rose-400 text-5xl">wifi_off</span>
                        <p className="text-white font-bold text-lg">Could not load video call</p>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Check your internet connection and try again.
                        </p>
                        <button
                            onClick={() => onClose('', 0)}
                            className="mt-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition"
                        >
                            Close
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
