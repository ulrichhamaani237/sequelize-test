const express = require('express');
const { createOder, g } = require('../../controllers/OrderController');
const router = express.Router();

router.post('/createOrder', createOder)
router.post('/createOrder', createOder)

module.exports = router;