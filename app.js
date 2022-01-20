const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { log } = require("console");
const e = require("express");

const app = express();

// To parse the body
app.use(bodyParser.urlencoded({ extended: false }))

// To Use CSS
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, 'views'))
app.set('view engine','ejs');

// Connecting mongoose to DB
mongoose.connect('mongodb://localhost:27017/bpDB');

const UserSchema = {
    Name:String,
    Age:Number,
    Money:Number,
    Password:String,
    Username:String
}

const taskSchema = {
    Name:String,
    Amount:Number,
    Type:String,
    User_id:String
}

const User = mongoose.model("User",UserSchema);
const Task = mongoose.model("Task",taskSchema);


// User Id
let current_user_id = "";


// Initial Route
app.get("/",(req,res)=>{
    if(current_user_id!=""){
        res.redirect("/home");
    }else{
        res.render("index");
    }
    
});

// Login Route
app.get("/login",(req,res)=>{
    res.render("login");
})

// Login Logic
app.post("/login",(req,res)=>{
    const loginInfo = req.body;
    let uname  = loginInfo.u_name;
    let key  = loginInfo.u_key;
    console.log("Given username is "+uname);
    console.log("Given key is "+ key);
    User.findOne({'Username':uname},(err,result)=>{
        if(err){
            console.log(err);
            res.redirect("/login"); 
        }else{
            console.log("Og psw is "+result.Password);
            if(result.Password == key){
                current_user_id = result._id;
                res.redirect("/home")
                console.log("Login Success");
            }else{
                console.log("Login Fail");
                res.redirect("/login");
            }
            console.log(result);
        }
    })

});

// Register Route
app.get("/register",(req,res)=>{
    res.render("register");
})

// Creating A New User
app.post("/register",(req,res)=>{
    const userDetails = req.body;
    const usr = new User({
        Name:userDetails.pname,
        Age:userDetails.age,
        Money:userDetails.money,
        Password:userDetails.password,
        Username:userDetails.username
    })
    usr.save();
    console.log("User successfully created!!");
    res.redirect("/");
});

// Home Route
app.get("/home",(req,res)=>{
    if(current_user_id==""){
        res.render("index")
    }else{
        res.render('home');
    }
    
});

// Task Route
app.get("/task",(req,res)=>{

    if(current_user_id!=""){
        Task.find({'User_id':current_user_id},(err,tasks)=>{
            if(err){
                console.log(err);
            }else{
                res.render("task",{data:tasks});
            }
        });
    }else{
        res.render("index");
    }

});

// Money Ruote
app.get("/money",(req,res)=>{
    res.render("money");
}) 

// Info Route
app.get("/info",(req,res)=>{

    res.render("profile");
});


// Add Task to DB
app.post("/home",(req,res)=>{
    const taskRetrieved = req.body;

    const task = Task({
        Name:taskRetrieved.task_name,
        Amount:taskRetrieved.task_amount,
        Type : taskRetrieved.task_type,
        User_id:current_user_id
    })
    task.save((err)=>{
        if(err){
            console.log(err);
        }else{
            console.log("Data added Successfully!");
        }
    })
    console.log(req.body);
    res.redirect("/home");
})


// LogOut
app.post("/logout",(req,res)=>{
    current_user_id = "";
    console.log("Successfully Loged Out");
    res.redirect("/");
});



// App Running
app.listen(3000,()=>{
    console.log("App is working");
})