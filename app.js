const express = require("express")
const app = express()
const userModel = require("./model/user")
const postModel = require("./model/post")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
app.use(cookieParser())
const multer = require("multer")
const crypto = require("crypto")
const path = require("path")
const multerconfig = require('./config/multerconfig')

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, "public")))





app.get("/", (req, res) => {
    res.render("index")
})

app.post("/create", (req, res) => {
    const {username, age, email, password} = req.body
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const user = await userModel.create({ 
            username,
            age,
            email,
            password: hash

            })
            const token = jwt.sign({email: req.body.email, userid: user._id}, "secret")
            res.cookie("token", token)
            res.redirect("/login")
        })
        
    })
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/login", async (req, res) => {

    if(!req.body.email || !req.body.password) return res.send("enter your email and password properly")

    const user = await userModel.findOne({email: req.body.email})
    if(!user) return res.status(500).send("No user found")

    bcrypt.compare(req.body.password, user.password, (err, result) => {
        if(result) {
            const token = jwt.sign({email: user.email, userid: user._id}, "secret")
            res.cookie("token", token)
            res.status(200).redirect("/profile") 
        }
        else {
            res.send("Password is wrong, You can't login")
        }
    })

})


app.get("/profile",isLoggedIn, async (req, res) => {   //this is a protected rout
    const user = await userModel.findOne({email: req.user.email}).populate("post")
    
    res.render("profile", {user})
})
 


app.get("/logout", (req, res) => {
    res.cookie("token", "")
    res.redirect("/")
})


//middleware
function isLoggedIn(req, res, next){    //middleware for protected routs
    if(req.cookies.token === "") res.send("You must be logged in")
    else{
        const data = jwt.verify(req.cookies.token, "secret")
        req.user = data
    }
    next()
}

app.post("/post", isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({email: req.user.email})
    const {content} = req.body

    const post = await postModel.create({
        user: user._id,
        content
    })
    user.post.push(post._id)
    await user.save()
    res.redirect("/profile")  
})

app.get("/like/:id",isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({_id: req.params.id}).populate("user")

    if(post.likes.indexOf(req.user.userid) === -1 ){
        post.likes.push(req.user.userid)
    } else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }

    await post.save()
    res.redirect("/profile")
})

app.get("/edit/:id",isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({_id: req.params.id})
    res.render("edit", {post})
})


app.post("/update/:id",isLoggedIn, async (req, res) => {
    const {content} = req.body
    await postModel.findOneAndUpdate({_id: req.params.id}, { content }, { new: true })
    res.redirect("/profile")

})



app.get("/delete/:id",isLoggedIn, async (req, res) => {
    const post = await postModel.findByIdAndDelete(req.params.id)
    res.redirect("/profile")
})

app.get("/profile/upload",isLoggedIn, (req, res) => {
    res.render("test")
})

app.post("/upload",isLoggedIn, multerconfig.single("image"), async (req, res) => {
    const user = await userModel.findOne({email: req.user.email})
    user.profilepic = req.file.filename
    await user.save()
    res.redirect("/profile")
    
})


app.listen(3000, () => {
    console.log("it's running...");
}) 