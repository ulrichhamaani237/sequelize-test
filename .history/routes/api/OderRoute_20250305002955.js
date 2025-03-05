const express = require('express');
const { createOder, getUserOrdes } = require('../../controllers/OrderController');
const router = express.Router();

router.post('/createOrder', createOder)
router.get('//', getUserOrdes)

module.exports = router;