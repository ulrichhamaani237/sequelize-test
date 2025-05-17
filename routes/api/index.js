const express = require('express')
const router = express.Router();

const userRoute = require('./UserRoutes')
const professionnelRoute = require('./ProfessionnelSanteRoutes')

router.use(userRoute);
router.use(professionnelRoute);

module.exports = router;

