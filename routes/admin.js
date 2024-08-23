import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";

const router= express.Router();
const saltRound=2;
var currentUser=0;
var isAdmin= true;
var message=null;

const db= new pg.Client({
    user: "postgres",
    host:"localhost",
    database: "Mess-Manager",
    password: "Pr@g@tiJ21",
    port: 5433
})

db.connect();

router.get('/register',(req,res)=>{
    res.render('admin-register.ejs',{message: message});
})

router.post("/register", async (req,res)=>{
    var today= new Date();
    const timestamp= today.toISOString().split('T')[0];
    console.log(typeof(timestamp));
    var messName= req.body.name;
    var ownerName= req.body.owner;
    var password= req.body.password;
    var repassword= req.body["re_pass"]
    messName= messName.toLowerCase();
    console.log(req.body);
    if(password!== repassword){
        message="Password don't match"
        res.redirect("/");
    }
    else{

        bcrypt.hash(password, saltRound, async (err,hash)=>{
            if(err){
              console.log(err.stack)
            }else{
              try {
                const checkResult = await db.query("SELECT * FROM admin WHERE messName = $1", [
                  messName,
                ]);
            
                if (checkResult.rows.length > 0) {
                  message="Mess Name already exists. Try again.";
                  res.redirect("/");
                } else {
                    const result= await db.query("Insert into admin(messName, ownerName, joinedDate, password) values($1, $2, $3, $4)",[messName,ownerName,timestamp,hash]);
                    message=null;
                    const userId= await db.query("select messId from admin where messName= $1",[messName]);
                    console.log(userId);
                    currentUser= userId.rows[0].messid
                    console.log(currentUser);
                    res.redirect("/admin/addinfo");
                }
              } catch (err) {
                console.log(err);
                message= err.message;
                res.redirect("/");
              }
            }
          })
    }
})

router.get("/addinfo",(req,res)=>{
    res.render("adminInfo.ejs",{message:message});
})

router.post("/addinfo", async (req,res)=>{
    // res.send(req.body);

    var phone= BigInt(req.body.phone);
    var address= req.body.address;
    var about= req.body.about;
    var serves= [];
    if(req.body.Breakfast) serves.push(req.body.Breakfast);
    if(req.body.Lunch) serves.push(req.body.Lunch);
    if(req.body.Snacks) serves.push(req.body.Snacks);
    if(req.body.Dinner) serves.push(req.body.Dinner);

    var isVeg= req.body.isVeg;
    console.log(req.body);

    try{
      console.log(currentUser);
      const result= await db.query("insert into messInfo(messid, phone, address, about, serves, veg) values($1,$2,$3,$4,$5, $6)",[
        currentUser, phone, address, about,serves,isVeg
      ])
      res.send(result);

    }catch(err){
      console.log(err.message)
      res.redirect("/admin/info");
    }
    // res.send(req.body);
})

router.get("/login", (req,res)=>{
  res.render("admin-login.ejs",{loginMessage: undefined});
})
    
router.post("/login", async(req,res)=>{
  var messName= req.body.messName;
  var password= req.body.password;
  messName= messName.toLowerCase();
  try{
    const checkResult = await db.query("SELECT * FROM admin WHERE messName = $1", [
      messName]);
      if(checkResult.rowCount ==0){
        res.send("Mess does not exist. Please sign up");
      }else{
        const dbPassword= checkResult.rows[0].password;
        bcrypt.compare(password, dbPassword,(error,result)=>{
          if(error){
            res.send(error.message);
          }else{
            currentUser= checkResult.rows[0].messid;
            console.log(currentUser);
            res.redirect("/menu/all");
          }
        })
      }
  }catch(err){
    res.render("admin-login.ejs",{loginMessage: err.message});
  }
  // res.render("admin-login.ejs",{loginMessage: undefined});
})

export default router;
export {currentUser,isAdmin};