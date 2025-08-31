const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/new-todo-app")

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    age: Number,
    profilepic: {
            type: String,
            default: ("pfp.jpg")
        },
    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
})

module.exports = mongoose.model('user', userSchema)