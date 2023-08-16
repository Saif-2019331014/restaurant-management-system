import express from "express"
import mysql from "mysql"
import bodyparser from "body-parser"
import session from "express-session"
// var popups = require('popups')
// import alert from "alert"

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
	saveUninitialized : false,
}));


app.set('views', './views');
app.set('view engine', 'ejs');


// const sql = "SELECT * FROM menu";
// const m = [];    
// db.query(sql, (err, data)=>{

// 	if(err) return res.json(err) 
// 	else { 
//         m = data;
//     }
// })

// console.log(m);

app.get("/", (req,res)=>{
    
    // console.log("hello this is backend :)")
    res.redirect('home');
})

app.get("/home", (req,res)=>{
 
    const query = "SELECT * FROM menu LIMIT 3";    

	db.query(query, (err, data)=>{

		if(err) return res.json(err) 
		else {
            const query1 = "SELECT DISTINCT type FROM menu";

            db.query(query1, (err, category)=>{

                if(err) return res.json(err)
                else {
                    console.log(req.session.user)
                    res.render('home', {user: req.session.user, data:data, category:category})
                }
            })
		}
	});
})

app.get("/login", (req,res)=>{
    if(!req.session.user){
        res.render('login', {user:req.session.user})
    }
    else res.redirect('home')
})

app.post("/login", (req,res)=>{

    const q = `SELECT * FROM customers WHERE email = '${req.body.email}' AND password = '${req.body.pass}'`;

    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else {
            if(data.length === 0){
                // alert("No such user exists!")
                //res.redirect('login');

                // popups.alert({
                //     content: 'No such user exists!'
                // });
                
                return res.json("No such user exists!")
            }
            else{
                req.session.user = data[0];
                // res.locals.user = req.session.user;
                console.log(`Welcome ${data[0].firstname}!`)
                res.redirect('home');
            }
        } 
    })
})

app.get("/menu", (req,res)=>{
    console.log(req.session.user);
    console.log(req.session.cart)
    const query = "SELECT * FROM menu";    

	db.query(query, (err, data)=>{

		if(err) return res.json(err) 
		else {
			res.render('menu', {user: req.session.user, data:data})
		}

	});
})

// for admin
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
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('profile', {user:req.session.user})
})

app.get("/checkout", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('checkout', {user:req.session.user})
})

app.get("/update_profile", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('update_profile', {user:req.session.user})
})

app.post("/update_profile", (req,res)=>{
 // kaj baki
})

app.get("/error", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('error_page', {user:req.session.user})
})

app.get("/cart", (req,res)=>{
    console.log(req.session)
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('cart', {user:req.session.user, cart:req.session.cart})
})

app.get("/orders", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('orders', {user:req.session.user})
})

app.get("/register", (req,res)=>{
    if(!req.session.user){
        res.render('register', {})
    }
    res.redirect('home')
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

            const q1 = `SELECT * FROM customers WHERE email = '${req.body.email}' AND password = '${req.body.pass}'`;

            db.query(q1, (err, data)=>{
                if(err) return res.json(err)
                else {
                    req.session.user = data[0];
                    console.log(`Welcome ${data[0].firstname}!`)
                    res.redirect('home');
                } 
            })
        } 
    })
})

app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect('home')
})

app.post('/addToCart', (req,res)=>{

    console.log('adding to cart')

    const q = `SELECT * FROM menu WHERE id = ${req.body.id}`;
    console.log(q);

    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else{
            if(!req.session.cart){
                req.session.cart = [];
            }
            const title = data[0].title;
            const price = parseFloat(data[0].price)
            console.log(typeof price);
            const quantity = parseInt(req.body.qty);
            console.log(typeof quantity);
            const subtotal = (price - (price * (parseFloat(data[0].discount) / 100.0)))* quantity;
            console.log(typeof subtotal);
            console.log(subtotal);
            req.session.cart.push({
                title : title,
                price : price,
                quantity : quantity,
                subtotal : subtotal
            })
            //console.log("hi" + req.session.user + " " + req.session.cart);
            res.redirect('menu');
        }
    })
});

app.get("/:id", (req,res)=>{

    const q = `SELECT * FROM menu WHERE type = '${req.params.id}'`;
    
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else {
            if(data.length === 0){
                res.redirect('error')
            }
            else{
                res.render('category', {user: req.session.user, data:data, category:req.params.id})
            }
        } 
    })
})

app.listen(8800, ()=>{
    console.log("Connected to backend!")
})