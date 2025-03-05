const { modes } = require("tar");
const user = require("../models/user")

 const creatUser = async (req, res) => {
 
    try {

        const {name, email} = req.body;

        const User = { name: "ulrich", email: "ulrich@example.com"}
        const newUser = await user.create({name: name, email: email});
        res.status(201).json(newUser);
    } catch (err) {
       res.status(500).json({err: "Error creating"}) 
    }   
}


module.exports = {
    creatUser
}