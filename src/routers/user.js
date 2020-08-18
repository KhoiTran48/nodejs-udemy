const express = require("express")
const router = new express.Router()
const User = require("../models/user");

router.post("/user", async (req, res)=>{
    const user = new User(req.body);
    // user.save().then((result)=>{
    //     res.status(201).send(result);
    // }).catch((e)=>{
    //     res.status(500).send(e);
    // })
    try {
        const result = await user.save();
        res.status(201).send(result)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get("/users",(req, res)=>{
    User.find({}).then((users)=>{
        res.send(users);
    }).catch((e)=>{
        res.status(500).send(); 
    })
})

router.get("/users/:id",(req, res)=>{
    const id = req.params.id

    User.findById(id).then((user)=>{
        if(!user){
            return res.status(400).send()
        }
        res.send(user)
    }).catch((e)=>{
        res.status(500).send();
    })
})

router.patch("/user/:id", async (req, res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        res.status(400).send({error: "Invalid updates"});
    }

    try {
        const user = await User.findById(req.params.id)
        if(!user){
            res.status(404).send()
        }
        
        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();
        res.send(user).send();
    } catch (error) {
        res.status(400).send()
    }
})

router.post("/users/login", async (req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        res.send(user)
    } catch (error) {
        res.status(400).send()
    }
})

module.exports = router
