const user = require("../models/user")

async function creatUser() {
 
    try {
        const User = { name: "ulrich", email: "ulrich@example.com"}
        const newUser = await user.create(User);
        res.status(201).json(newUser);
    } catch (err) {
       res.status(500).json({err: "Error creating"}) 
    }   
}
creatUser()