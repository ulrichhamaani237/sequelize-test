const express = require('express')
const cors = require('cors'); // Importer CORS

const http = require('http')
const app = express();
const server = http.createServer(app);


app.listen(5000, ()=>{
    console.log("Server listen on PORT: 5000");
    
})
