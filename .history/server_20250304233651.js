const express = require('express')
const cors = require('cors'); // Importer CORS
const bodyParser = require('body-parser');
const userRoute = require('./routes/api/UserRoutes')


const http = require('http')
const app = express();

app.use(cors()); // Activer CORS pour gérer les requêtes cross-origin
app.use(bodyParser.json());
app.use('/user',userRoute)

app.listen(5000, ()=>{
    console.log("Server listen on PORT: http://localhost:5000");
    
})
