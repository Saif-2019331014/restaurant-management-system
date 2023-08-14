import express from "express"
import mysql from "mysql"
import bodyparser from "body-parser"
import session from "express-session"
import cookieParser from "cookie-parser"

const app = express()

// database connection
const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"ithinkiseeu5020",
    database:"rms"
})

app.use(express.json())

app.use(express.static('public'));

app.use(bodyparser.urlencoded({ extended : false }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
	secret : '1234567890abcdefghijklmnopqrstuvwxyz',
	resave : false,
	saveUninitialized : true,
	cookie : { secure : false }
}));

app.use(cookieParser());

app.set('views', './views');
app.set('view engine', 'ejs');

// let user = {
//     id : null,
//     firstname : null,
//     lastname : null,
//     phone : null,
//     address : null,
//     email : null,
//     password : null
// }


app.get("/", (req,res)=>{
    
    // console.log("hello this is backend :)")
    res.redirect('home');
})

app.get("/home", (req,res)=>{
    console.log(session.user);

    const query = "SELECT * FROM menu LIMIT 3";    

	db.query(query, (err, data)=>{

		if(err) return res.json(err) 
		else {
            const query1 = "SELECT DISTINCT type FROM menu";

            db.query(query1, (err, category)=>{

                if(err) return res.json(err)
                else {
                    res.render('home', {user: req.session.user, data:data, category:category})
                }
            })
		}
	});
})

app.get("/menu", (req,res)=>{
    const query = "SELECT * FROM menu";    

	db.query(query, (err, data)=>{

		if(err) return res.json(err) 
		else {
			res.render('menu', {user: req.session.user, data:data})
		}

	});
})

app.get("/login", (req,res)=>{
    res.render('login', {})
})

app.post("/login", (req,res)=>{

    const q = `SELECT * FROM customers WHERE email = '${req.body.email}' AND password = '${req.body.pass}'`;

    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else {
            if(data.length === 0){
                return res.json("No such user exists!")
            }
            else{
                req.session.user = data[0];
                res.locals.user = req.session.user;
                ///console.log(res.locals.user);
                console.log(`Welcome ${data[0].firstname}!`)
                res.redirect('home');
            }
        } 
    })
})


app.post("/menu", (req,res)=>{
    const q = "INSERT INTO menu (title, content, type, price) VALUES (?)";
    const values = [
        req.body.title,
        req.body.content,
        req.body.type,
        req.body.price
    ];
    db.query(q, [values], (err, data)=>{
        if(err) return res.json(err)
        else {
            console.log("Menu item has been created successfully.")
            res.redirect('menu')
        }
    })
})

app.get("/profile", (req,res)=>{
    res.render('profile', {})
})

app.get("/checkout", (req,res)=>{
    res.render('checkout', {})
})

app.get("/update_profile", (req,res)=>{
    res.render('update_profile', {})
})

app.post("/update_profile", (req,res)=>{
    res.render('update_profile', {})
})

app.get("/error_page", (req,res)=>{
    res.render('error_page', {})
})

app.get("/cart", (req,res)=>{
    res.render('cart', {})
})

app.get("/orders", (req,res)=>{
    res.render('orders', {})
})

app.get("/register", (req,res)=>{
    res.render('register', {})
})

app.post("/register", (req,res)=>{

    const q = "INSERT INTO customers (firstname, lastname, phone, address, email, password) VALUES (?)";

    const values = [
        req.body.fname,
        req.body.lname,
        req.body.number,
        req.body.address,
        req.body.email,
        req.body.pass
    ];
    db.query(q, [values], (err, data)=>{
        if(err) return res.json(err)
        else {
            console.log("customer acc creation successful");
            res.redirect('home');
        } 
    })
})

app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect('home')
})

app.get("/:id", (req,res)=>{

    const q = `SELECT * FROM menu WHERE type = '${req.params.id}'`;
    
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else {
            console.log(data);
            res.render('category', {data:data, category:req.params.id})
        } 
    })
})

app.listen(8800, ()=>{
    console.log("Connected to backend!")
})