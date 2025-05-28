const socketIO = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        if (!io) {
            io = socketIO(httpServer, {
                cors: {
                    origin: process.env.FRONTEND_URL || "http://localhost:5173",
                    methods: ["GET", "POST"],
                    credentials: true
                }
            });

            io.on('connection', (socket) => {
                console.log('Client connected:', socket.id);

                socket.on('disconnect', () => {
                    console.log('Client disconnected:', socket.id);
                });
            });
        }
        return io;
    },
    getIO: () => {
        if (!io) {
            console.warn('Socket.io not initialized! Attempting to initialize...');
            // Retourner null au lieu de throw une erreur pour éviter de bloquer l'application
            return null;
        }
        return io;
    }
}; 