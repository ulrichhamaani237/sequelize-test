const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoute = require('./routes/api/UserRoutes');
const OrderRoute = require('./routes/api/OderRoute');
const cineRoute = require('./routes/api/CineRoutes');
const patientRoutes = require('./routes/api/PatientRoutes');
const ProfessionnelSanteRoutes = require('./routes/api/ProfessionnelSanteRoutes');
const medXchangeRoute = require('./routes/api/medXchangeRoute');
// const {query} = require('./config/db');

// Dans la console Node.js
const bcrypt = require('bcrypt');
const testKey = "homar_homar_2000-07-06";
const storedHash = "$2b$10$xBGDt1j7FaS8UHs96sAleOcIsfmIOb6ijJ5ybipz6xflE.GGwcvSe";
bcrypt.compare(testKey, storedHash).then(console.log);
const app = express();
app.use(express.json());
app.use(cors()); // Activer CORS pour gérer les requêtes cross-origin
app.use(bodyParser.json());
app.use('/user', userRoute);
app.use('/order', OrderRoute);
app.use('/actors', cineRoute);
app.use('/patients', patientRoutes);
app.use('/professionnels', ProfessionnelSanteRoutes);
app.use('/dossier', medXchangeRoute);

app.listen(5000, () => {
  console.log("Server listen on PORT: http://localhost:5000");
});