const User = require('../models')
 const creatUser = async (req, res) => {
 
    try {

        const {name, email} = req.body;

        const newUser = User.
        res.status(201).json(newUser);
    } catch (err) {
       res.status(500).json({err: "Error creating"}) 
    }   
}


module.exports = {
    creatUser
}