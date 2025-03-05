const express = require('express');
const { createOder } = require('../../controllers/OrderController');
const router = express.Router();

router.post('/createOrder', createOder)
router.post('/createOrder', createOder)

module.exports = router;