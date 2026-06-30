import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { setupVideoSignaling } from './socket/videoSignaling.js';

// Connect to Database
connectDB();

const PORT = env.PORT || 5000;

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Attach Socket.io for WebRTC signaling
setupVideoSignaling(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Video signaling (Socket.io) ready on port ${PORT}`);
});

