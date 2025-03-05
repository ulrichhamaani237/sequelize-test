const express = require('express')
const router = express.Router();

const userRoute = require('./UserRoutes')

router.use('/users', userRoute);

mode

