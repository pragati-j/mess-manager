import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { currentUser } from "./admin.js";
import { messid, memberid,membername } from "./user.js";

const router= express.Router();
const saltRound=2;
var date=null;
var meal=null;

const db= new pg.Client({
    user: "postgres",
    host:"localhost",
    database: "Mess-Manager",
    password: "Pr@g@tiJ21",
    port: 5433
})

db.connect();


router.get("/all",async (req,res)=>{
    if(currentUser===0){
      res.send("Sign in to view menu")
    }else{
      var today= new Date();
      const timestamp= today.toISOString().split('T')[0];
      res.render('showMenu.ejs',{date: today});
    }
  })
  router.post("/all",async (req,res)=>{
    if(currentUser===0){
      res.send("Sign in to view menu")
    }else{
      var date= req.body.menuDate;
      console.log(date);
      const result= await db.query("select * from menu where mess_id=$1 and menudate=$2",[currentUser,date]);
      console.log(result.rows)
      res.render('showMenu.ejs',{date: date, menus: result.rows});
    }
  })
  
  router.get("/add", (req,res)=>{
    if(currentUser==0){
      res.send("Sign in to add menu");
    }else{
      res.render("addMenu.ejs");
    }
  })
  
  router.post("/add", async(req,res)=>{
    res.send(req.body);
    if(currentUser==0){
      res.send("Sign in to add menu");
    }else{
      var values="";
      var names= req.body.Name;
      // console.log(names[0], typeof(names))
      
      for(var i=0;i<req.body.Name.length;i++){
    
        var amt= parseInt(req.body["amount"][i])
        var ms= parseInt(req.body["maxServing"])
        const result= await db.query("insert into menu values( $1, $2, $3, $4, $5, $6, $7, $8)",[currentUser, req.body["Name"][i], req.body.serving, req.body["category"][i], ms, amt,req.body.date, req.body.timing]);
       }
  
      }
  })
  
  
  router.get("/select",(req,res)=>{
    console.log(messid);
    console.log(memberid);
    res.render('selectMenu.ejs'); 
  })
  router.post("/select", async (req,res)=>{
    date= req.body.date;
    meal= req.body.meal;
    console.log(messid);
    console.log(memberid);
    const result= await db.query("select * from menu where mess_id= $1 and menudate= $2 and serving= $3",[messid,date,meal]);
    var data= result.rows;
    res.render("selectMenu.ejs",{menus: data});
  })
  
  router.post("/update", async(req,res)=>{
    var today= new Date();
    if(memberid==0){
      res.send("Sign in as Member First to select menu")
    }else{
      const quantites= req.body;
      for(var[itemName, quantity] of Object.entries(quantites)){
        const temp= await db.query("select * from orderdetail where messid=$1 and memberid=$2 and item_name=$3 and foodtype=$4 and menudate=$5",[
          messid, memberid, itemName, meal, date
        ])
        if(temp.rowCount==0){
          const charges= await db.query("select amount from menu where mess_id=$1 and item_name= $2 and serving=$3 and menudate=$4",[messid, itemName, meal, date]); 
          const charge= charges.rows[0]['amount']*quantity;
          await db.query("insert into orderdetail(messid, memberid, item_name, foodtype, quantity, charges, ordertime, menudate, membername) values($1, $2, $3, $4, $5, $6, $7, $8, $9)",[
          messid, memberid, itemName, meal, quantity, charge, today, date, membername
        ])
      }else{
        const charges= await db.query("select amount from menu where mess_id=$1 and item_name= $2 and serving=$3 and menudate=$4",[messid, itemName, meal, date]); 
        const charge= charges.rows[0]['amount']*quantity;
        await db.query("update orderdetail set quantity=$1, charges= $2 where messid=$3 and memberid=$4 and item_name=$5 and foodtype=$6 and menudate=$7",[
          quantity, charge, messid, memberid, itemName, meal, date
        ])
      }
      }
    }
  })

export default router;