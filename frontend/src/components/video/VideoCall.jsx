"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const ICE_SERVERS = {
    iceServers: [
        // Free Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Free Open Relay Project TURN servers (relays traffic when STUN fails)
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:a.relay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
};

// Resolve signaling server socket URL dynamically based on current page host
const SOCKET_URL = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000';

export default function VideoCall({ consultationId, userRole, userName, onClose }) {
    const [callState, setCallState] = useState('connecting'); // connecting | waiting | in-call | ended | error
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isPeerMuted, setIsPeerMuted] = useState(false);
    const [isPeerCameraOff, setIsPeerCameraOff] = useState(false);
    const [peerName, setPeerName] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [socketStatus, setSocketStatus] = useState('Connecting to server...');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const timerRef = useRef(null);
    const peerId = useRef(null);
    const pendingCandidates = useRef([]);
    const roomId = `nutrikid-consult-${consultationId}`;

    const formatDuration = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const cleanup = useCallback(() => {
        clearInterval(timerRef.current);
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        socketRef.current?.disconnect();
        localStreamRef.current = null;
        pcRef.current = null;
    }, []);

    const endCall = useCallback(() => {
        socketRef.current?.emit('end-call', { roomId });
        setCallState('ended');
        cleanup();
    }, [roomId, cleanup]);

    // Helper function to flush candidates received before remote description was set
    const processPendingCandidates = useCallback(async () => {
        if (!pcRef.current || !pcRef.current.remoteDescription) return;
        
        console.log(`[WebRTC] Flushing ${pendingCandidates.current.length} queued ICE candidates...`);
        for (const candidate of pendingCandidates.current) {
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.warn('[WebRTC] Failed to add queued candidate:', e);
            }
        }
        pendingCandidates.current = [];
    }, []);

    const createPeerConnection = useCallback((remotePeerId) => {
        if (pcRef.current) {
            pcRef.current.close();
        }
        
        console.log('[WebRTC] Creating RTCPeerConnection...');
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        peerId.current = remotePeerId;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Receive remote stream
        pc.ontrack = (event) => {
            console.log('[WebRTC] Remote track received!');
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Send local ICE candidates to backend
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    to: remotePeerId,
                    candidate: event.candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection status:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallState('in-call');
                timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
            } else if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
                if (pc.connectionState === 'failed') {
                    setErrorMsg('Failed to establish WebRTC connection. Please verify your network.');
                    setCallState('error');
                } else {
                    setCallState('ended');
                }
                cleanup();
            }
        };

        return pc;
    }, [cleanup]);

    useEffect(() => {
        let mounted = true;

        const start = async () => {
            // 1. Get Camera/Mic streams
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                console.log('[WebRTC] Local video/audio successfully acquired.');
            } catch (err) {
                console.error('[WebRTC] Camera access failed:', err);
                if (!mounted) return;
                setErrorMsg('Camera/microphone access was denied. Please allow permissions and try again.');
                setCallState('error');
                return;
            }

            // 2. Connect to Socket.io signaling
            console.log('[WebRTC] Connecting to signaling server:', SOCKET_URL);
            setSocketStatus('Connecting to signaling server...');

            const socket = io(SOCKET_URL, {
                path: '/socket.io',
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                timeout: 10000,
            });
            socketRef.current = socket;

            const connectTimeout = setTimeout(() => {
                if (!mounted) return;
                if (callState === 'connecting') {
                    setErrorMsg('Unable to connect to signaling server. Verify backend is running on port 5000.');
                    setCallState('error');
                    socket.disconnect();
                }
            }, 12000);

            socket.on('connect', () => {
                clearTimeout(connectTimeout);
                if (!mounted) return;
                console.log('[WebRTC] Socket connected. ID:', socket.id);
                setSocketStatus('Joining room...');
                socket.emit('join-room', { roomId, userRole, userName });
            });

            socket.on('connect_error', (err) => {
                clearTimeout(connectTimeout);
                if (!mounted) return;
                console.error('[WebRTC] Socket connection error:', err);
                setErrorMsg(`Signaling server connection error: ${err.message}`);
                setCallState('error');
            });

            socket.on('room-joined', async ({ peersInRoom }) => {
                if (!mounted) return;
                console.log('[WebRTC] Room joined. Peers:', peersInRoom);

                if (peersInRoom.length === 0) {
                    setCallState('waiting');
                    setSocketStatus('');
                } else {
                    const remotePeerId = peersInRoom[0];
                    const pc = createPeerConnection(remotePeerId);

                    try {
                        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', { to: remotePeerId, offer });
                        console.log('[WebRTC] Outgoing Offer sent to peer:', remotePeerId);
                    } catch (offerErr) {
                        console.error('[WebRTC] Error creating offer:', offerErr);
                    }
                }
            });

            socket.on('peer-joined', ({ peerId: remotePeerId, userName: remName }) => {
                if (!mounted) return;
                console.log('[WebRTC] Remote peer joined:', remotePeerId, remName);
                setPeerName(remName || 'Other party');
            });

            socket.on('offer', async ({ from, offer }) => {
                if (!mounted) return;
                console.log('[WebRTC] Incoming Offer received from:', from);
                const pc = createPeerConnection(from);
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    await processPendingCandidates(); // Flush any queued candidates
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('answer', { to: from, answer });
                    console.log('[WebRTC] Outgoing Answer sent to:', from);
                } catch (ansErr) {
                    console.error('[WebRTC] Error processing offer / creating answer:', ansErr);
                }
            });

            socket.on('answer', async ({ answer }) => {
                if (!mounted) return;
                console.log('[WebRTC] Incoming Answer received.');
                try {
                    if (pcRef.current && pcRef.current.signalingState !== 'stable') {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                        await processPendingCandidates(); // Flush any queued candidates
                    }
                } catch (err) {
                    console.error('[WebRTC] Error setting remote description answer:', err);
                }
            });

            socket.on('ice-candidate', async ({ candidate }) => {
                if (!mounted) return;
                if (pcRef.current && pcRef.current.remoteDescription) {
                    try {
                        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        // Ignore stale candidates
                    }
                } else {
                    // Queue candidate until remote description is set
                    pendingCandidates.current.push(candidate);
                }
            });

            socket.on('peer-media-toggle', ({ type, enabled }) => {
                if (!mounted) return;
                if (type === 'audio') setIsPeerMuted(!enabled);
                if (type === 'video') setIsPeerCameraOff(!enabled);
            });

            socket.on('call-ended', () => {
                if (!mounted) return;
                console.log('[WebRTC] Partner ended the call.');
                setCallState('ended');
                cleanup();
            });

            socket.on('peer-left', () => {
                if (!mounted) return;
                console.log('[WebRTC] Partner disconnected.');
                setCallState('ended');
                cleanup();
            });
        };

        start();

        return () => {
            mounted = false;
            cleanup();
        };
    }, [consultationId, processPendingCandidates, createPeerConnection]);

    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current && !isCameraOff) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [isCameraOff]);

    const toggleMic = () => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (!audioTrack) return;
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socketRef.current?.emit('media-toggle', { roomId, type: 'audio', enabled: audioTrack.enabled });
    };

    const toggleCamera = () => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (!videoTrack) return;
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        socketRef.current?.emit('media-toggle', { roomId, type: 'video', enabled: videoTrack.enabled });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-4xl bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                style={{ minHeight: 520 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm">video_call</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">NutriKid Private Video Call</p>
                            <p className="text-xs">
                                {callState === 'in-call' ? (
                                    <span className="text-green-400 font-bold">● Live · {formatDuration(callDuration)}</span>
                                ) : callState === 'waiting' ? (
                                    <span className="text-amber-400">Waiting for other party to join...</span>
                                ) : callState === 'connecting' ? (
                                    <span className="text-slate-400">{socketStatus || 'Connecting...'}</span>
                                ) : callState === 'error' ? (
                                    <span className="text-red-400">Connection failed</span>
                                ) : (
                                    <span className="text-red-400">Call ended</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Video Area */}
                <div className="relative flex-1 bg-[#0f172a] flex items-center justify-center" style={{ minHeight: 380 }}>

                    {/* Remote Video Stream */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${callState !== 'in-call' ? 'hidden' : ''}`}
                        style={{ maxHeight: 420 }}
                    />

                    {/* Peer camera-off screen */}
                    {callState === 'in-call' && isPeerCameraOff && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e293b]">
                            <div className="w-20 h-20 rounded-full bg-slate-700/60 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-slate-400 text-4xl">videocam_off</span>
                            </div>
                            <p className="text-slate-300 font-medium text-sm">{peerName || 'Other party'} has turned off video</p>
                        </div>
                    )}

                    {/* Status Overlays */}
                    {callState !== 'in-call' && callState !== 'ended' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            {callState === 'error' ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
                                    </div>
                                    <p className="text-white font-bold text-lg">Connection Error</p>
                                    <p className="text-slate-400 text-sm text-center max-w-sm px-4">{errorMsg}</p>
                                    <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition">
                                        Close Window
                                    </button>
                                </>
                            ) : callState === 'waiting' ? (
                                <>
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-indigo-400 text-5xl">person</span>
                                        </div>
                                        <span className="absolute bottom-1 right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-[#0f172a] animate-pulse" />
                                    </div>
                                    <p className="text-white font-bold text-lg">Waiting for partner...</p>
                                    <p className="text-slate-400 text-sm">Call connects automatically when they click Join.</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                    <p className="text-white font-medium">{socketStatus || 'Connecting WebRTC call...'}</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Call Ended Screen */}
                    {callState === 'ended' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f172a]">
                            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400 text-4xl">call_end</span>
                            </div>
                            <p className="text-white font-bold text-xl">Call Ended</p>
                            <p className="text-slate-400 text-sm">Duration: {formatDuration(callDuration)}</p>
                            <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition">
                                Close Call
                            </button>
                        </div>
                    )}

                    {/* Local picture-in-picture video */}
                    <div className="absolute bottom-4 right-4 w-36 h-24 md:w-48 md:h-32 rounded-2xl overflow-hidden border-2 border-slate-600 shadow-xl bg-slate-800">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {isCameraOff && (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <span className="material-symbols-outlined text-slate-500 text-3xl">videocam_off</span>
                            </div>
                        )}
                        <div className="absolute bottom-1 left-2 text-[10px] text-white font-bold bg-black/50 px-1.5 py-0.5 rounded-md">
                            You {isMuted && '(Muted)'}
                        </div>
                    </div>

                    {/* Remote Muted notification banner */}
                    {callState === 'in-call' && isPeerMuted && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            <span className="material-symbols-outlined text-sm text-red-400">mic_off</span>
                            {peerName || 'Other party'} is muted
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 py-5 bg-[#1e293b] border-t border-slate-700/50">
                    <button
                        onClick={toggleMic}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                        <span className="material-symbols-outlined text-white text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
                    </button>

                    <button
                        onClick={endCall}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-red-900/40"
                        title="Hang up / End call"
                    >
                        <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                    </button>

                    <button
                        onClick={toggleCamera}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title={isCameraOff ? 'Turn video camera on' : 'Turn video camera off'}
                    >
                        <span className="material-symbols-outlined text-white text-2xl">{isCameraOff ? 'videocam_off' : 'videocam'}</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
