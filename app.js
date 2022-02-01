const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// Need To remove Chartjs package
const Chart = require("chart.js");
const CryptoJS = require("crypto-js");
const cookieParser = require("cookie-parser");
// Using dotenv
require("dotenv").config({ path: __dirname + "/.env" });
const port = process.env.PORT||3000;

const app = express();

// Usong cookieparser
app.use(cookieParser());

// To parse the body
app.use(bodyParser.urlencoded({ extended: false }));

// To Use CSS
app.use(express.static(__dirname + "/public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Connecting mongoose to DB
mongoose.connect(process.env["MONGODB"]);

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

// Initial Route
app.get("/", (req, res) => {
  res.cookie("bpid", "initial");
  if (req.cookies.bpid != "initial") {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

// Login Route
app.get("/login", (req, res) => {
  res.render("login");
});

// Login Logic
app.post("/login", (req, res) => {
  const loginInfo = req.body;
  let uname = loginInfo.u_name;
  let key = loginInfo.u_key;
  User.findOne({ Username: uname }, (err, result) => {
    try {
      if (result.Password == CryptoJS.SHA256(key).toString(CryptoJS.enc.Hex)) {
        res.cookie("bpid", result._id);
        res.redirect("/home");
        console.log("Login Success");
      } else {
        console.log("Login Fail due to wrong password");
        res.redirect("/login");
      }
    } catch (err) {
      res.render("notfound");
      console.log("User Not found");
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
    Password: CryptoJS.SHA256(userDetails.password).toString(CryptoJS.enc.Hex),
    Username: userDetails.username,
  });
  usr.save();
  console.log("User successfully created!!");
  res.redirect("/");
});

// Home Route
app.get("/home", (req, res) => {
  if (req.cookies.bpid == "initial") {
    console.log("Login Fail");
    res.redirect("/");
  } else {
    console.log("Login Success");
    res.render("home");
  }
});

// Task Route
app.get("/task", (req, res) => {
  if (req.cookies.bpid != "initial") {
    Task.find({ User_id: req.cookies.bpid }, (err, tasks) => {
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
  if (req.cookies.bpid != "initial") {
    res.render("money");
  } else {
    res.redirect("/");
  }
});

// Updating Money
app.post("/money", (req, res) => {
  const data = Number(req.body.money_add);
  User.findOne({ _id: req.cookies.bpid }, (err, dataF) => {
    if (err) {
      console.log(err);
    } else {
      let money = dataF.Money;
      money += data;
      // Adding money to the database
      User.findByIdAndUpdate(
        { _id: req.cookies.bpid },
        { Money: money },
        (e, doc) => {
          if (e) {
            console.log(e);
          } else {
            console.log("Data Updated!!");
            res.redirect("/money");
          }
        }
      );
    }
  });
});

// Add Task to DB
app.post("/home", (req, res) => {
  console.log(req.body);
  User.findOne({ _id: req.cookies.bpid }, (err, found) => {
    if (err) {
      console.log(err);
    } else {
      console.log("This is the user money" + found.Money);

      let new_money = found.Money - req.body.task_amount;
      if (new_money >= 0) {
        console.log("This is the updated money " + new_money);
        User.findOneAndUpdate(
          { _id: req.cookies.bpid },
          { Money: new_money },
          (er, out) => {
            if (er) {
              console.log(err);
            } else {
              const taskRetrieved = req.body;
              const task = Task({
                Name: taskRetrieved.task_name,
                Amount: taskRetrieved.task_amount,
                Type: taskRetrieved.task_type,
                User_id: req.cookies.bpid,
              });
              task.save((exp) => {
                if (exp) {
                  console.log(exp);
                } else {
                  console.log("Task Saved To DB");
                  res.redirect("/home");
                }
              });
            }
          }
        );
      } else {
        console.log("Insufficient Funds");
        res.redirect("/home");
      }
    }
  });
});

// Graph Route
let graph = "bar";

app.post("/line", (req, res) => {
  graph = "line";
  res.redirect("/graph");
});
app.post("/bar", (req, res) => {
  graph = "bar";
  res.redirect("/graph");
});
app.post("/pie", (req, res) => {
  graph = "pie";
  res.redirect("/graph");
});
app.post("/dough", (req, res) => {
  graph = "doughnut";
  res.redirect("/graph");
});
app.post("/radar", (req, res) => {
  graph = "radar";
  res.redirect("/graph");
});

app.get("/graph", (req, res) => {
  if (req.cookies.bpid != "initial") {
    var type_A = 0;
    var type_B = 0;
    var type_C = 0;
    Task.find({ User_id: req.cookies.bpid }, (err, tasks) => {
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
        res.render("graph", {
          t1: type_A,
          t2: type_B,
          t3: type_C,
          graph_type: graph,
        });
      }
    });
  } else {
    res.redirect("/");
  }
});
// Info Route
app.get("/info", (req, res) => {
  if (req.cookies.bpid != "initial") {
    User.findOne({ _id: req.cookies.bpid }, (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.render("profile", {
          name: user.Name,
          age: user.Age,
          mleft: user.Money,
        });
      }
    });
  } else {
    res.redirect("/");
  }
});

// LogOut
app.post("/logout", (req, res) => {
  res.clearCookie();
  console.log("Successfully Loged Out");
  res.redirect("/");
});

// App Running
app.listen(port, () => {
  console.log("App is working");
});
