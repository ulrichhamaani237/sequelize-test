const { Order } = require('../models');

const createOder = async (req, res) =>{
    try {
    const { totalPrice, userId } = req.body;
    const order = await Order.create({totalPrice, userId});
    res.status(201).json(order);
        
    } catch (err) {
        
    } 
}