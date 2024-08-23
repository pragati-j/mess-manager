import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import { currentUser } from "./admin.js";
import bcrypt from "bcrypt";

const router= express.Router();
const saltRound=2;
var memberid=0;
var messid=0;
var membername="";

const db= new pg.Client({
    user: "postgres",
    host:"localhost",
    database: "Mess-Manager",
    password: "Pr@g@tiJ21",
    port: 5433
})

db.connect();

router.get("/register", async(req,res)=>{
    if(currentUser==0){
      res.send("You are signed out. Try Logging in");
    }else{
      res.render("user-register.ejs")
    }
});

router.post("/register", async (req,res)=>{
    console.log(req.body);  
    if(currentUser==0){
      res.send("You are signed out. Try Logging in");
    }
    else{
      var today= new Date();
      today= today.toISOString().split('T')[0];
      const name= req.body.name;
      const age= req.body.age;
      const gender= req.body.gender;
      const phone= req.body.phone;
      const mail= req.body.email;
      console.log(req.body);
      const result= await db.query("Insert into members(membername,messid, joineddate, age, gender, phone, email) values($1,$2,$3, $4, $5, $6, $7)",[name, currentUser, today, age, gender, phone , mail]);
      // res.status(200).send(`The new member id is ${memberid}`);
    }
})
  
router.get("/login", (req,res)=>{  
    res.render("user-login.ejs");
})
  
router.post("/login", async(req,res)=>{  
    if(req.body.email){
      var email= req.body.email;
      var password= req.body.password;
      const result= await db.query("select * from members where email= $1", [email]);
      if(result.rowCount==0){
        res.status(400).send("Email not Register");
      }else{
        const record= result.rows[0];
        memberid= record.memberid;
        messid= record.messid;
        membername= record.membername;
        if(record.password){
          var dbPassword= record.password;
          bcrypt.compare(password, dbPassword, async(err, hash)=>{
            if(err){
              res.status(400).send("Wrong password!");
            }else{
              res.send(`Hello ${record.membername}`);
            }
          });
        }else{
          bcrypt.hash(password,saltRound, async(err,hash)=>{
            if(err){
              res.status(400).send(err.message);
            }else{
              var temp= await db.query("update members set password= $1 where email= $2",[hash,email])
              res.send("Logged In")
            }
          })
        }
      }
    }else{
      var phone= req.body.phone;
      var password= req.body.password;
      const result= await db.query("select * from members where phone= $1", [phone]);
      if(result.rowCount==0){
        res.status(400).send("Number not Register");
      }else{
        const record= result.rows[0];
        memberid= record.memberid;
        messid= record.messid;
        membername= record.membername;
        if(record.password){
          var dbPassword= record.password;
          bcrypt.compare(password, dbPassword, async(err, hash)=>{
            if(err){
              res.status(400).send("Wrong password!");
            }else{
              res.send(`Hello ${record.membername}`);
            }
          });
        }else{
          bcrypt.hash(password,saltRound, async(err,hash)=>{
            if(err){
              res.status(400).send(err.message);
            }else{
              var temp= await db.query("update members set password= $1 where phone= $2",[hash,phone])
              res.send("Logged In")
            }
          })
        }
      }
      }
})

export default router;
export {memberid,messid,membername};