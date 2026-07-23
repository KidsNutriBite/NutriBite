import asyncHandler from 'express-async-handler';
import ApiResponse from '../utils/apiResponse.js';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

/**
 * POST /api/video/room
 * Creates (or retrieves) a Daily.co room for a consultation.
 * Room name is deterministic: nutrikid-{consultationId}
 * so both parties always land in the same room.
 */
export const getOrCreateRoom = asyncHandler(async (req, res) => {
    const { consultationId } = req.body;

    if (!consultationId) {
        res.status(400);
        throw new Error('consultationId is required');
    }

    if (!DAILY_API_KEY) {
        res.status(500);
        throw new Error('DAILY_API_KEY is not configured in server environment');
    }

    const roomName = `nutrikid-${consultationId}`;

    // Try to get existing room first
    const getRes = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });

    if (getRes.ok) {
        const room = await getRes.json();
        return res.status(200).json(new ApiResponse(200, { url: room.url, name: room.name }, 'Room retrieved'));
    }

    // Room doesn't exist — create it
    const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: roomName,
            privacy: 'public',
            properties: {
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expires in 24 hours
                enable_chat: true,
                enable_screenshare: true,
                start_video_off: false,
                start_audio_off: false,
            },
        }),
    });

    if (!createRes.ok) {
        const err = await createRes.json();
        res.status(502);
        throw new Error(`Daily.co error: ${err?.error || 'Failed to create room'}`);
    }

    const room = await createRes.json();
    return res.status(201).json(new ApiResponse(201, { url: room.url, name: room.name }, 'Room created'));
});
