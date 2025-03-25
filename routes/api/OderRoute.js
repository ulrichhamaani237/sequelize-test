const express = require('express');
const { createOder, getUserOrdes, getAllUsers } = require('../../controllers/OrderController');
const router = express.Router();

router.post('/createOrder', createOder)
router.get('/getUserOrders/:userId', getUserOrdes)
router.get('/allUsers', getAllUsers)

module.exports = router;