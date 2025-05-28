const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { setupNotificationClient, setupUserNotificationClient } = require('./config/db');
const bodyParser = require('body-parser');
const patientRoutes = require('./routes/api/PatientRoutes');
const ProfessionnelSanteRoutes = require('./routes/api/ProfessionnelSanteRoutes');
const medXchangeRoute = require('./routes/api/medXchangeRoute');
const app = express();
const server = http.createServer(app);

// Configuration CORS pour Express
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Initialiser Socket.IO avec la configuration CORS
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Stocker l'instance io
global.io = io;

// gestion des connection socketIO
io.on('connection', (socket) => {
  console.log('client connecté');
  
  // Écouter les événements de notification lue
  socket.on('mark_notification_read', (data) => {
    console.log(`Notification ${data.notificationId} marquée comme lue pour l'utilisateur ${data.userId}`);
    // Ajouter ici la logique pour mettre à jour en base de données
  });
  
  socket.on('mark_all_notifications_read', (data) => {
    console.log(`Toutes les notifications de l'utilisateur ${data.userId} marquées comme lues`);
    // Ajouter ici la logique pour mettre à jour en base de données
  });
});

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// routes middleware 
// app.use('/patients', patientRoutes);
app.use('/dossier', ProfessionnelSanteRoutes);
app.use('/dossier', medXchangeRoute);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listen on PORT: http://localhost:${PORT}`);
});