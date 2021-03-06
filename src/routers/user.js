const express = require("express")
const router = new express.Router()
const User = require("../models/user");
const auth = require("../middleware/auth")
const multer = require("multer")
const sharp = require("sharp")
const {sendWelcomeEmail} = require('../emails/account')

router.post("/user", async (req, res)=>{
    const user = new User(req.body);
    // user.save().then((result)=>{
    //     res.status(201).send(result);
    // }).catch((e)=>{
    //     res.status(500).send(e);
    // })
    try {
        const result = await user.save();
        const token = await result.generateAuthToken()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send({result, token})
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

router.get("/users/me", auth, async (req, res)=>{
    try {
        await req.user.populate('tasks').execPopulate()
        const tasks = req.user.tasks
        res.send({"user": req.user,"tasks": tasks })
    } catch (e) {
        res.status(500).send()
    }
})

router.get("/users/:id", auth, (req, res)=>{
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
        const token = await user.generateAuthToken();
        res.send({user, token})
    } catch (error) {
        res.status(400).send()
    }
})

router.post("/users/logout", auth, async (req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(400).send()
    }
})

router.post("/users/logoutAll", auth, async (req, res)=>{
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(400).send()
    }
})

const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(doc|docx|jpg)$/)){
            return cb(new Error("File isn't allowed"))
        }
        cb(undefined, true)
        // cb(new Error('File must be a PDF'))
        // cb(undefined, false)
        // cb(undefined, true)
    }
})

router.post("/users/me/avatar", auth, upload.single('inputFileName'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send();
    
},(error, req, res, next)=>{
    res.status(400).send({error: error.message})
})

router.get("/user/:id/avatar", async (req, res)=>{
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error('no avatar')
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

const middlewareError = (req, res)=>{
    throw new Error('middleware error')
}

router.get("/middleware/error", middlewareError, async (req, res)=>{
    res.send();
},(error, req, res, next)=>{
    res.status(400).send({error: error.message})
})

module.exports = router
