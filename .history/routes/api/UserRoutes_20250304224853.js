const express = require('express')
const router = express.Router()

const {creatUser} = require('../../controllers/UserController')

router.post('/creatuser')
