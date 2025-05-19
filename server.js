const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { setupNotificationClient,setupUserNotificationClient } = require('./config/db');
const bodyParser = require('body-parser');
const patientRoutes = require('./routes/api/PatientRoutes');
const ProfessionnelSanteRoutes = require('./routes/api/ProfessionnelSanteRoutes');
const medXchangeRoute = require('./routes/api/medXchangeRoute');
const  personnelRoute = require('./routes/api/ProfessionnelSanteRoutes')
const app = express();
const server = http.createServer(app);
// Configurer CORS pour Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "*", // ou spécifiez votre domaine frontend
    methods: ["GET", "POST"]
  }
});

// Rendre io accessible globalement
global.socket = io;

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
app.use('/patients', patientRoutes);
app.use('/professionnels', ProfessionnelSanteRoutes);
app.use('/dossier', medXchangeRoute);
app.use('/dossier', personnelRoute)

// IMPORTANT: Utiliser 'server' au lieu de 'app' pour écouter
server.listen(5000, () => {
  console.log("Server listen on PORT: http://localhost:5000");
});