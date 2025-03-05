const user = require("../models/user")

async function creatUser(req, res) {
 
    try {
        const User = { name: "ulrich", email: "ulrich@example.com"}
        const newUser = await user.create(User);

        res
    } catch (err) {
        
    } finally {
        
    }
    
}