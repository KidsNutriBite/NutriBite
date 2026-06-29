import { Server } from 'socket.io';

export const setupVideoSignaling = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: false,
        },
        path: '/socket.io',
        transports: ['polling', 'websocket'],
    });

    // Track rooms: roomId -> Set of socket IDs
    const rooms = new Map();

    io.on('connection', (socket) => {
        console.log(`[Video] Socket connected: ${socket.id}`);

        // Join a call room based on consultation ID
        socket.on('join-room', ({ roomId, userRole, userName }) => {
            socket.join(roomId);

            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            rooms.get(roomId).add(socket.id);

            const peersInRoom = [...rooms.get(roomId)].filter(id => id !== socket.id);

            // Tell the new joiner about existing peers
            socket.emit('room-joined', { peersInRoom, yourId: socket.id });

            // Tell existing peers someone new joined
            socket.to(roomId).emit('peer-joined', {
                peerId: socket.id,
                userRole,
                userName,
            });

            socket.data.roomId = roomId;
            socket.data.userRole = userRole;
            socket.data.userName = userName;
            console.log(`[Video] ${userName} (${userRole}) joined room: ${roomId}`);
        });

        // Relay WebRTC offer
        socket.on('offer', ({ to, offer }) => {
            io.to(to).emit('offer', { from: socket.id, offer });
        });

        // Relay WebRTC answer
        socket.on('answer', ({ to, answer }) => {
            io.to(to).emit('answer', { from: socket.id, answer });
        });

        // Relay ICE candidates
        socket.on('ice-candidate', ({ to, candidate }) => {
            io.to(to).emit('ice-candidate', { from: socket.id, candidate });
        });

        // Relay media toggle events (mute/camera)
        socket.on('media-toggle', ({ roomId, type, enabled }) => {
            socket.to(roomId).emit('peer-media-toggle', {
                peerId: socket.id,
                type,
                enabled,
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const roomId = socket.data.roomId;
            if (roomId && rooms.has(roomId)) {
                rooms.get(roomId).delete(socket.id);
                if (rooms.get(roomId).size === 0) rooms.delete(roomId);
                else io.to(roomId).emit('peer-left', { peerId: socket.id });
            }
            console.log(`[Video] Socket disconnected: ${socket.id}`);
        });

        // Call ended by one party
        socket.on('end-call', ({ roomId }) => {
            socket.to(roomId).emit('call-ended');
        });
    });

    return io;
};

