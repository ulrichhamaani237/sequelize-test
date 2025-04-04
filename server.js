const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { setupNotificationClient,setupUserNotificationClient } = require('./config/db');
const bodyParser = require('body-parser');
const userRoute = require('./routes/api/UserRoutes');
const OrderRoute = require('./routes/api/OderRoute');
const cineRoute = require('./routes/api/CineRoutes');
const patientRoutes = require('./routes/api/PatientRoutes');
const ProfessionnelSanteRoutes = require('./routes/api/ProfessionnelSanteRoutes');
const medXchangeRoute = require('./routes/api/medXchangeRoute');
const crypto = require('crypto')

// const {query} = require('./config/db');



const texteEntrant = 'ulruch';
const cleExistante = '1e28b39e8b81'; // Remplace par ta clé réelle

const cleGeneree = crypto.createHash('sha256').update(texteEntrant).digest('hex').substring(0, 12);
const estValide = cleGeneree === cleExistante;

console.log('Clé générée :', cleGeneree);
console.log('Clé valide ?', estValide); 
// Dans la console Node.js
const bcrypt = require('bcrypt');
const testKey = "homar_homar_2000-07-06";
const storedHash = "$2b$10$xBGDt1j7FaS8UHs96sAleOcIsfmIOb6ijJ5ybipz6xflE.GGwcvSe";
bcrypt.compare(testKey, storedHash).then(console.log);


const app = express();
const server = http.createServer(app);

// Configuration Socket.io
global.io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});




// Après la configuration de Socket.io
Promise.all([
  setupNotificationClient(),
  setupUserNotificationClient()
]).then((client) => {
  global.notificationClient = client;
  console.log('Listener PostgreSQL activé');
  console.log('Tous les listeners PostgreSQL sont activés');
});

app.use(express.json());
app.use(cors()); // Activer CORS pour gérer les requêtes cross-origin
app.use(bodyParser.json());
// routes middleware 
app.use('/user', userRoute);
app.use('/order', OrderRoute);
app.use('/actors', cineRoute);
app.use('/patients', patientRoutes);
app.use('/professionnels', ProfessionnelSanteRoutes);
app.use('/dossier', medXchangeRoute);

app.listen(5000, () => {
  console.log("Server listen on PORT: http://localhost:5000");
});