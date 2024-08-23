import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import { PORT } from "./config.js";
import bcrypt from "bcrypt";
import adminRouter,{currentUser,isAdmin} from "./routes/admin.js"
import userRouter,{memberid, messid} from "./routes/user.js"
import menuRouter from "./routes/menu.js"
import cors from "cors";

const app= express();
const saltRound=2;
var date=null;
var meal= null;
const db= new pg.Client({
    user: "postgres",
    host:"localhost",
    database: "Mess-Manager",
    password: "Pr@g@tiJ21",
    port: 5433
})

db.connect();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'))
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/menu",menuRouter);
app.use(cors());

app.get("/",(req,res)=>{
  res.send("Hello User!")
  // res.render("home.ejs");
})


app.get("/orders/summary", async(req,res)=>{
  if(currentUser==0){
    res.send("Log in to see orders!")
  }else{
    var date= new Date();
    var today= date.toISOString().split('T')[0];
    const results= await db.query("select * from orderdetail where menudate=$1 and messid=$2",[today, currentUser]);
    res.render("orders.ejs",{orders: results.rows, date: today})
  }
})

app.post("/orders/summary", async(req,res)=>{
  var date= req.body.date;
  if(currentUser==0){
    res.send("Log in to see orders!");
  }else{
    const results= await db.query("select * from orderdetail where menudate=$1 and messid=$2",[date, currentUser]);
    res.render("orders.ejs",{orders: results.rows, date: date})
  }
})

app.get("/orders/items/:date", async(req,res)=>{
  if(currentUser==0){
    res.send("Log in to see orders!")
  }else{
    var today= req.params.date;
    const results= await db.query("select foodtype, item_name, sum(quantity) as quantities, sum(charges) as amount from orderdetail where menudate=$1 and messid=$2 group by foodtype, item_name order by foodtype",[today, currentUser]);
    res.render("summary.ejs",{orders: results.rows})
  }
})

app.listen(PORT,(req,res)=>{
    console.log(`server listening to the ${PORT}`);
})