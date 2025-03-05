const express = require('express')
const cors = require('cors'); // Importer CORS
const bodyParser = require('body-parser');
const userRoute = req


const http = require('http')
const app = express();
const server = http.createServer(app);
const indexRoutes = require('./routes/api/index')
app.use(bodyParser.json());
app.use('/user',indexRoutes)

app.listen(5000, ()=>{
    console.log("Server listen on PORT: http://localhost:5000");
    
})
