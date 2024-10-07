import express from "express";
import pg from "pg";
import session from "express-session";
import passport from "passport";

const app = express();
const port = 3000;
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"todo",
    password:"shiva",
    port:5432
});
let userEmail ;
let userPassword;
db.connect();
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:"TOPSECRET",
    resave:false,
    saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());
app.get("/",(req,res)=>{
    res.redirect("/register");
});
app.get("/register",(req,res)=>{
    res.render("register.ejs");
});
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
app.post("/register",async(req,res)=>{
    const username = req.body.username;
    const useremail = req.body.useremail;
    const userpassword = req.body.userpassword;
    userEmail = useremail;
    userPassword = userpassword;
    try{
        await db.query("INSERT INTO users(username,useremail,userpassword) VALUES($1,$2,$3)",[username,useremail,userpassword]);
        res.redirect("/tasks");
    }catch(err){
        res.render("register.ejs",{error:"Email already exists.Please LOGIN"});
    }
});
app.post("/login",async(req,res)=>{
    const useremail = req.body.useremail;
    const userpassword = req.body.userpassword;
    userEmail = useremail;
    userPassword = userpassword;
    let result = await db.query("SELECT * FROM users WHERE useremail = $1",[useremail]);
    if(result.rows.length===0){
        res.render("login.ejs",{error:"Email doesn't exists.Please REGISTER"});
    }else{
        if(result.rows[0].userpassword == userpassword){
            res.redirect("/tasks");
        }else{
            res.render("login.ejs",{error:"Wrong password"});
        }
    }
});
app.get("/user",(req,res)=>{
    userEmail = req.query.email;
    res.redirect("/");
});
app.get("/tasks",async(req,res)=>{
    if(userEmail){
        try{
            const result = await db.query("SELECT * FROM tasks where useremail = $1",[userEmail]);
            res.render("index.ejs",{toDoTasks:result.rows});
        }catch(err){
            console.log("Error",err);
            res.status(500).send("Internal Server Error");
        }
    }else{
        res.redirect("/register");
    }
});

app.get("/new-task",(req,res)=>{
    if(userEmail){
        res.render("new.ejs");
    }else{
        res.redirect("/register");
    }
    
});
app.get("/tasks/delete/:id",async(req,res)=>{
    if(userEmail){
        const id = req.params.id;
        try{
            await db.query("DELETE FROM tasks WHERE id = $1",[id]);
            res.redirect("/tasks");
        }catch(err){
            res.status(500).send("Internal Server Error");
        }
    }else{
        res.redirect("/register");
    }
});
app.get("/tasks/edit/:id",async(req,res)=>{
    if(userEmail){
        const id = req.params.id;
        try{
            let query = await db.query("SELECT * FROM tasks WHERE id = $1",[id]);
            let result = query.rows[0].task;
            res.render("new.ejs",{taskID:id,task:result});
        }catch(err){
            res.status(500).send("Internal Server Error");
        }
    }else{
        res.redirect("/register");
    }
});
app.post("/new-task",async(req,res)=>{
    if(userEmail){
        try{
            await db.query("INSERT INTO tasks(task,useremail) VALUES($1,$2)",[req.body.task,userEmail]);
            res.redirect("/tasks");
        }catch(err){
            console.log(err);
            res.status(500).send("Internal Server Error");
        }
    }else{
        res.redirect("/register");
    }
});




app.post("/edit-task",async(req,res)=>{
    if(userEmail){
        try{
            await db.query("UPDATE tasks SET task = $1 WHERE id=$2",[req.body.task,req.body.id]);
            res.redirect("/tasks");
        }catch(err){
            console.log(err);
            res.status(500).send("Internal Server Error");
        }
    }else{
        res.redirect("/register");
    }

});





process.on('SIGINT', async () => {
    await db.end();
    console.log('Database connection closed');
    process.exit(0);
});
app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});




