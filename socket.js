const socketIO = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        if (!io) {
            io = socketIO(httpServer, {
                cors: {
                    origin: process.env.FRONTEND_URL || "http://localhost:5173",
                    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                    allowedHeaders: ["Content-Type", "Authorization"],
                    credentials: true
                },
                transports: ['websocket', 'polling'],
                pingTimeout: 60000,
                pingInterval: 25000,
                connectTimeout: 45000,
                allowEIO3: true
            });

            io.on('connection', (socket) => {
                console.log('Client connected:', socket.id);

                // Rejoindre la salle de l'utilisateur
                socket.on('join-user-room', (userId) => {
                    socket.join(`user_${userId}`);
                    console.log(`User ${userId} joined their room`);
                });

                // Rejoindre la salle des administrateurs
                socket.on('join-admin-room', () => {
                    socket.join('admin_room');
                    console.log(`User joined admin room`);
                });

                // Gestion des erreurs de connexion
                socket.on('error', (error) => {
                    console.error('Socket error:', error);
                });

                socket.on('disconnect', (reason) => {
                    console.log('Client disconnected:', socket.id, 'Reason:', reason);
                });
            });

            // Gestion des erreurs globales
            io.engine.on('connection_error', (err) => {
                console.error('Connection error:', err);
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