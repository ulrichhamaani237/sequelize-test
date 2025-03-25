const express = require('express')
const {getActors} =require('../../controllers/cineControllers')
const router = express.Router();

router.get('/getActors', getActors)

module.exports = router;