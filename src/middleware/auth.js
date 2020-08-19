const jwt = require("jsonwebtoken")
const User = require("../models/user")

const auth = async (req, res, next)=>{
    try {
        const token = req.header("Authorization")
        const decoded = jwt.verify(token, "jwtkey")
        const user = await User.findOne({ _id: decoded._id, "tokens.token": token})
        if(!user){
            throw new Error()
        }
        req.user = user
        next()
    } catch (error) {
        res.status(401).send({"error": "Please authenticate."})
    }
    
}
module.exports = auth;