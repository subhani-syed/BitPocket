const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Chart = require("chart.js");
const CryptoJS = require('crypto-js');

const app = express();

// To parse the body
app.use(bodyParser.urlencoded({ extended: false }));

// To Use CSS
app.use(express.static(__dirname + "/public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Connecting mongoose to DB
mongoose.connect("mongodb://localhost:27017/bpDB");

const UserSchema = {
  Name: String,
  Age: Number,
  Money: Number,
  Password: String,
  Username: String,
};

const taskSchema = {
  Name: String,
  Amount: Number,
  Type: String,
  User_id: String,
};

const User = mongoose.model("User", UserSchema);
const Task = mongoose.model("Task", taskSchema);

// User Id
let current_user_id = "";

// Initial Route
app.get("/", (req, res) => {
  if (current_user_id != "") {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

// Login Route
app.get("/login", (req, res) => {
  // var seed_hash = CryptoJS.SHA256("a").toString(CryptoJS.enc.Hex);
  // console.log("This is the seed "+seed_hash);
  res.render("login");
});

// Login Logic
app.post("/login", (req, res) => {
  const loginInfo = req.body;
  let uname = loginInfo.u_name;
  let key = loginInfo.u_key;
  // console.log("Given username is " + uname);
  // console.log("Given key is " + key);
  User.findOne({ Username: uname }, (err, result) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      // console.log("Og psw is " + result.Password);
      if (result.Password == CryptoJS.SHA256(key).toString(CryptoJS.enc.Hex)) {
        current_user_id = result._id;
        res.redirect("/home");
        console.log("Login Success");
      } else {
        console.log("Login Fail");
        res.redirect("/login");
      }
      // console.log("This "+result);
    }
  });
});

// Register Route
app.get("/register", (req, res) => {
  res.render("register");
});

// Creating A New User
app.post("/register", (req, res) => {
  const userDetails = req.body;
  const usr = new User({
    Name: userDetails.pname,
    Age: userDetails.age,
    Money: userDetails.money,
    // Password: userDetails.password,
    Password:CryptoJS.SHA256(userDetails.password).toString(CryptoJS.enc.Hex),
    Username: userDetails.username,
  });
  usr.save();
  console.log("User successfully created!!");
  res.redirect("/");
});

// Home Route
app.get("/home", (req, res) => {
  if (current_user_id == "") {
    res.redirect("/");
  } else {
    res.render("home");
  }
});

// Task Route
app.get("/task", (req, res) => {
  if (current_user_id != "") {
    Task.find({ User_id: current_user_id }, (err, tasks) => {
      if (err) {
        console.log(err);
      } else {
        res.render("task", { data: tasks });
      }
    });
  } else {
    res.render("index");
  }
});

// Money Ruote
app.get("/money", (req, res) => {
  if(current_user_id!==""){
    res.render("money");
  }else{
    res.redirect("/");
  }
  
});

// Updating Money
app.post("/money",(req,res)=>{
  const data = Number(req.body.money_add);
  User.findOne({'_id':current_user_id},(err,dataF)=>{
    if(err){
      console.log(err);
    }else{
      let money=dataF.Money;
      money+=data;
      // Adding money to the database
      User.findByIdAndUpdate({'_id':current_user_id},{'Money':money},(e,doc)=>{
        if(e){
          console.log(e);
        }else{
          console.log("Data Updated!!");
          res.redirect("/money");
        }
      });

    }
  })
});


// Add Task to DB
app.post("/home", (req, res) => {
  console.log(req.body);
  User.findOne({'_id':current_user_id},(err,found)=>{
    if(err){
      console.log(err);
    }else{
      console.log("This is the user money"+found.Money);

      let new_money = found.Money- req.body.task_amount;
      if(new_money>=0){
        console.log("This is the updated money "+new_money);
        User.findOneAndUpdate({'_id':current_user_id},{'Money':new_money},(er,out)=>{
          if(er){
            console.log(err);
          }else{
            const taskRetrieved = req.body;
            const task = Task({
              Name: taskRetrieved.task_name,
              Amount: taskRetrieved.task_amount,
              Type: taskRetrieved.task_type,
              User_id: current_user_id,
            });
            task.save((exp)=>{
              if(exp){
                console.log(exp)
              }else{
                console.log("Task Saved To DB");
                res.redirect("/home");
              }
            })
          }
        })
        
      }else{
        console.log("Insufficient Funds");
        res.redirect("/home");
      }
    }
  })
});

// Graph Route
app.get("/graph", (req, res) => {
  if(current_user_id!==""){
    var type_A = 0;
  var type_B = 0;
  var type_C = 0;
  Task.find({ User_id: current_user_id }, (err, tasks) => {
    if (err) {
      console.log(err);
    } else {
      tasks.forEach((task) => {
        if (task.Type === "Type A") {
          type_A = type_A + task.Amount;
        } else if (task.Type === "Type B") {
          type_B = type_B + task.Amount;
        } else if (task.Type === "Type C") {
          type_C = type_C + task.Amount;
        }
      });
      console.log("The Final A is -> " + type_A);
      console.log("The Final B is -> " + type_B);
      console.log("The Final C is -> " + type_C);
      res.render("graph", {
        test: "Helllo",
        t1: type_A,
        t2: type_B,
        t3: type_C,
        t: 100,
      });
    }
  });
  }else{
    res.redirect("/");
  }
});

// Info Route
app.get("/info", (req, res) => {
  if(current_user_id!==""){
    User.findOne({'_id':current_user_id},(err,user)=>{
      if(err){
        console.log(err);
      }else{
        res.render("profile",{
          name:user.Name,
          age:user.Age,
          mleft:user.Money
        })
      }
    });
  }else{
    res.redirect("/");
  }
});

// LogOut
app.post("/logout", (req, res) => {
  current_user_id = "";
  console.log("Successfully Loged Out");
  res.redirect("/");
});

// App Running
app.listen(3000, () => {
  console.log("App is working");
});

