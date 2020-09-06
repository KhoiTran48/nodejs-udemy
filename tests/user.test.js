const request = require("supertest")
const app = require("./../src/app")
const User = require('./../src/models/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'one',
    email: 'one@gmail.com',
    password: 'password',
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_KEY)
    }]
}

beforeEach(async ()=>{
    await User.deleteMany()
    await new User(userOne).save()
})

beforeAll(()=>{
    console.log('before All')
})

test("should signup a new user", async ()=>{
    const res = await request(app).post('/user').send({
        name: 'two',
        email: 'two@gmail.com',
        password: 'password'
    }).expect(201)

    const user = await User.findById(res.body.result._id)
    expect(user).not.toBeNull()

    expect(res.body).toMatchObject({
        result:{
            name: 'two',
            email: 'two@gmail.com',
        },
        token: user.tokens[0].token
    })
})

test('should login existing user', async ()=>{
    const res = await request(app).post('/users/login').send({
        email: 'one@gmail.com',
        password: 'password'
    }).expect(200)
    // console.log(res.body)
})

test('should not login nonexisting user', async ()=>{
    const res = await request(app).post('/users/login').send({
        email: 'one@gmail.com',
        password: 'wrong password'
    }).expect(400)
})

test('should get profile for user', async ()=>{
    const res = await request(app).get('/users/me')
            .set('Authorization', userOne.tokens[0].token)
            .send()
            .expect(200)
    // console.log(res.body)
})

test('should upload avatar image', async ()=>{
    await request(app)
            .post('/users/me/avatar')
            .set('Authorization', userOne.tokens[0].token)
            .attach('inputFileName', 'tests/fixtures/eagle.jpg')
            .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})
