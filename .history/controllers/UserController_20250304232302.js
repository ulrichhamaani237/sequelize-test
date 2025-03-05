const User = require("../m")

 const creatUser = async (req, res) => {
 
    try {

        const {name, email} = req.body;

        const User = { name: "ulrich", email: "ulrich@example.com"}
        const newUser = await User.create({name, email});
        res.status(201).json(newUser);
    } catch (err) {
       res.status(500).json({err: "Error creating"}) 
    }   
}


module.exports = {
    creatUser
}