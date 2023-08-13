import express from "express"
import mysql from "mysql"
import bodyparser from "body-parser"

const app = express()

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"ithinkiseeu5020",
    database:"rms"
})

app.use(express.json())

app.use(express.static('public'));

app.use(bodyparser.urlencoded({ extended : false }));

app.set('views', './views');
app.set('view engine', 'ejs');

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
                    console.log(category);

                    res.render('home', {data:data, category:category})
                }
            })
		}
	});
})

app.get("/login", (req,res)=>{
    res.render('login', {})
})

app.get("/menu", (req,res)=>{
    const query = "SELECT * FROM menu";    

	db.query(query, (err, data)=>{

		if(err) return res.json(err) 
		else {
			res.render('menu', {data:data})
		}

	});
    // const q = "SELECT * FROM menu"
    // db.query(q,(err,data)=>{
    //     if(err) return res.json(err)
    //     return res.json(data)
    // })
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
        return res.json("Menu item has been created successfully.")
    })
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

    const q = "INSERT INTO customers (firstname, lastname, email, password) VALUES (?)";

    const values = [
        req.body.fname,
        req.body.lname,
        req.body.number,
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

app.listen(8800, ()=>{
    console.log("Connected to backend!")
})