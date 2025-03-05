const { Order } = require('../models');

const createOder = async (req, res) =>{
    try {
    const { totalPrice, userId } = req.body;
    const order = await Order.create({totalPrice, userId});
    res.status(201).json(order);
        
    } catch (err) {
        console.log("Error in createOrder", err);
        res.status(500).json({message: "Internal server error"});
        
    } 
}

const getUserOrdes = async (req, res) =>{
    try {

        const userId = req.params.userId

        const userOrders = await User.findByPk(userId, )
        
    } catch (err) {
        
    } 
}

module.exports = {
    createOder
}