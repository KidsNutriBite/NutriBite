"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { endTeleconsultation } from '../../api/consultation.api';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export default function WebRTCVideoCall({
    consultationId,
    callRoomId,
    userRole,
    userName,
    userId,
    childName = 'Child',
    onClose,
    onCallEnded
}) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [remotePeerPresent, setRemotePeerPresent] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);
    const [endingCall, setEndingCall] = useState(false);

    // Doctor Notes Modal before ending
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [doctorNotes, setDoctorNotes] = useState('');
    const [medicines, setMedicines] = useState('');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Format timer
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Create Canvas Fallback Stream if webcam is missing
    const createFallbackStream = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(userName || 'User', 320, 240);

        const videoTrack = canvas.captureStream(15).getVideoTracks()[0];
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        const audioTrack = dest.stream.getAudioTracks()[0];

        const stream = new MediaStream([videoTrack]);
        if (audioTrack) stream.addTrack(audioTrack);
        return stream;
    };

    // Initialize Media & WebRTC
    const initCall = useCallback(async () => {
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
        } catch (mediaErr) {
            console.warn('[WebRTC] Camera/mic access fallback:', mediaErr.message);
            toast.error('Webcam or Microphone not available. Running in simulated media mode.');
            stream = createFallbackStream();
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        // Connect Socket.IO
        const socket = io(backendUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to PeerConnection
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        // Remote stream received
        pc.ontrack = (event) => {
            console.log('[WebRTC] Remote stream track received:', event.streams);
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setRemotePeerPresent(true);
            }
        };

        // ICE candidate found locally -> send to peer
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    to: pc.targetPeerId,
                    candidate: event.candidate
                });
            }
        };

        socket.on('connect', () => {
            console.log('[WebRTC Socket] Connected:', socket.id);
            setIsConnected(true);
            socket.emit('join-room', {
                roomId: callRoomId,
                userRole,
                userName,
                userId
            });
        });

        // Other peer was already in the room -> initiator creates offer
        socket.on('room-joined', async ({ peersInRoom }) => {
            console.log('[WebRTC] Existing peers in room:', peersInRoom);
            if (peersInRoom.length > 0) {
                const targetId = peersInRoom[0];
                pc.targetPeerId = targetId;
                setRemotePeerPresent(true);

                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { to: targetId, offer });
                } catch (err) {
                    console.error('[WebRTC] Error creating offer:', err);
                }
            }
        });

        // A new peer joined after us
        socket.on('peer-joined', ({ peerId, userRole: remoteRole, userName: remoteName }) => {
            console.log(`[WebRTC] Peer joined: ${remoteName} (${remoteRole}) - ID: ${peerId}`);
            pc.targetPeerId = peerId;
            setRemotePeerPresent(true);
            toast.success(`${remoteName} joined the call!`);
        });

        // Handle incoming WebRTC Offer
        socket.on('offer', async ({ from, offer }) => {
            console.log('[WebRTC] Received offer from:', from);
            pc.targetPeerId = from;
            setRemotePeerPresent(true);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { to: from, answer });
            } catch (err) {
                console.error('[WebRTC] Error handling offer:', err);
            }
        });

        // Handle incoming WebRTC Answer
        socket.on('answer', async ({ from, answer }) => {
            console.log('[WebRTC] Received answer from:', from);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error('[WebRTC] Error setting remote description:', err);
            }
        });

        // Handle incoming ICE candidate
        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                if (candidate && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error('[WebRTC] Error adding ICE candidate:', err);
            }
        });

        // Peer left
        socket.on('peer-left', () => {
            setRemotePeerPresent(false);
            toast.error('The other participant left the session.');
        });

        // Call ended by doctor
        socket.on('call-ended', ({ notes }) => {
            toast.success('Consultation session ended by Doctor.');
            if (onCallEnded) onCallEnded(notes);
            cleanupAndClose();
        });

        // Start call timer
        timerIntervalRef.current = setInterval(() => {
            setCallSeconds((prev) => prev + 1);
        }, 1000);

    }, [backendUrl, callRoomId, userRole, userName, userId, onCallEnded]);

    const cleanupAndClose = useCallback(() => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        onClose();
    }, [onClose]);

    useEffect(() => {
        initCall();
        return () => {
            cleanupAndClose();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Toggle Mic
    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle Camera
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Doctor ends consultation
    const handleDoctorEndSubmit = async (e) => {
        if (e) e.preventDefault();
        setEndingCall(true);
        try {
            await endTeleconsultation(consultationId, {
                doctorNotes,
                medicinesDiscussed: medicines.split(',').map((m) => m.trim()).filter(Boolean)
            });
            toast.success('Consultation ended and records saved.');
            if (onCallEnded) onCallEnded(doctorNotes);
            cleanupAndClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to end consultation');
        } finally {
            setEndingCall(false);
            setShowNotesModal(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header Bar */}
                <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-black text-sm md:text-base">
                                    Clinical Video Consultation
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Patient: {childName}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${userRole === 'doctor' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                    {userRole}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Room: <span className="font-mono text-slate-300">{callRoomId}</span> - {remotePeerPresent ? 'Peer Connected' : 'Waiting for other party to join...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-rose-400 text-base">timer</span>
                            {formatTime(callSeconds)}
                        </div>

                        {userRole === 'doctor' ? (
                            <button
                                onClick={() => setShowNotesModal(true)}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-rose-900/40"
                            >
                                <span className="material-symbols-outlined text-base">call_end</span>
                                End Consultation
                            </button>
                        ) : (
                            <button
                                onClick={cleanupAndClose}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                            >
                                <span className="material-symbols-outlined text-base">logout</span>
                                Leave
                            </button>
                        )}
                    </div>
                </div>

                {/* Video Stage */}
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    {/* Remote Video (Main Stage) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-contain ${remotePeerPresent ? 'block' : 'hidden'}`}
                    />

                    {/* Waiting Screen if remote peer not connected */}
                    {!remotePeerPresent && (
                        <div className="flex flex-col items-center justify-center p-6 text-center z-0">
                            <div className="size-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl mb-4 shadow-xl">
                                {userRole === 'doctor' ? '👶' : '👨‍⚕️'}
                            </div>
                            <h4 className="text-white font-black text-lg mb-1">
                                {userRole === 'doctor' ? 'Waiting for Parent to Join...' : 'Connecting to Dr. Session...'}
                            </h4>
                            <p className="text-slate-400 text-xs max-w-sm">
                                {userRole === 'doctor'
                                    ? 'The parent has received your notification. Their video feed will appear once they click Join.'
                                    : 'You are in the consultation room. The doctor will see you shortly.'}
                            </p>
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) */}
                    <div className="absolute bottom-6 right-6 w-44 md:w-56 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20 group">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : 'block'}`}
                        />
                        {isVideoOff && (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-850 text-slate-400 text-xs">
                                <span className="material-symbols-outlined text-2xl mb-1 text-slate-500">videocam_off</span>
                                Camera Off
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                            You ({userName})
                        </div>
                    </div>
                </div>

                {/* Floating Bottom Control Bar */}
                <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-4 z-10">
                    <button
                        onClick={toggleAudio}
                        className={`size-12 rounded-full flex items-center justify-center transition-all ${
                            isAudioMuted
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title={isAudioMuted ? 'Unmute' : 'Mute'}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isAudioMuted ? 'mic_off' : 'mic'}
                        </span>
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`size-12 rounded-full flex items-center justify-center transition-all ${
                            isVideoOff
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isVideoOff ? 'videocam_off' : 'videocam'}
                        </span>
                    </button>

                    {userRole === 'doctor' && (
                        <button
                            onClick={() => setShowNotesModal(true)}
                            className="px-5 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-rose-900/30"
                        >
                            <span className="material-symbols-outlined text-lg">edit_note</span>
                            <span>End & Record Notes</span>
                        </button>
                    )}
                </div>

                {/* Doctor Clinical Notes Modal */}
                <AnimatePresence>
                    {showNotesModal && (
                        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="text-white font-black text-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-400">clinical_notes</span>
                                        End Consultation & Save Notes
                                    </h4>
                                    <button
                                        onClick={() => setShowNotesModal(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <p className="text-xs text-slate-400">
                                    Ending the call will terminate the video session for both you and the parent. Please record any clinical advice, diet changes, or follow-ups below.
                                </p>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                        Doctor Notes / Clinical Advice
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={doctorNotes}
                                        onChange={(e) => setDoctorNotes(e.target.value)}
                                        placeholder="e.g., Increase dietary iron via ragi dosa. Follow up in 14 days if symptoms persist."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                        Supplements / Medicines Discussed (Comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={medicines}
                                        onChange={(e) => setMedicines(e.target.value)}
                                        placeholder="e.g., Zinc Drops, Iron Syrup 5ml, Vitamin D3"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNotesModal(false)}
                                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={endingCall}
                                        onClick={handleDoctorEndSubmit}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {endingCall ? 'Saving & Ending...' : 'Confirm & End Consultation'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
