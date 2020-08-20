const express = require("express")
const router = new express.Router()
const Task = require("../models/task");
const auth = require("../middleware/auth")

router.post("/task", auth, async (req, res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        const result = await task.save();
        res.status(201).send(result)
    } catch (error) {
        res.status(500).send(error)
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=1&skip=2
router.get("/tasks", auth, async (req, res)=>{
    const match = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip)
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.get("/task/:id", auth, async (req, res)=>{
    const id = req.params.id
    try {
        const task = await Task.findById(id)
        if(!task){
            return res.status(404).send()
        }
        await task.populate('owner').execPopulate()
        res.send(task)
    } catch (error) {
        res.status(500).send();
    }
})

module.exports = router

