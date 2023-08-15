import express from "express";
import mysql from "mysql";
import bodyparser from "body-parser";
import session from "express-session";
// import cookieParser from "cookie-parser";

const app = express();

// database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Triple$:)",
  database: "rms",
});

app.use(express.json());

app.use(express.static("public"));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "1234567890abcdefghijklmnopqrstuvwxyz",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: false },
  })
);

// app.use(cookieParser());

app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  // console.log("hello this is backend :)")
  res.redirect("home");
});

app.get("/home", (req, res) => {
  const query = "SELECT * FROM menu LIMIT 3";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    else {
      const query1 = "SELECT DISTINCT type FROM menu";

      db.query(query1, (err, category) => {
        if (err) return res.json(err);
        else {
          console.log(req.session.user);
          if (!req.session.user) {
            // console.log("login nei ");
            req.session.user = {
              id: null,
            };
          }
          //console.log(req.session.user);
          res.render("home", {
            user: req.session.user,
            data: data,
            category: category,
          });
        }
      });
    }
  });
});

app.get("/login", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
  }
  res.render("login", { user: req.session.user });
});

app.post("/login", (req, res) => {
  const q = `SELECT * FROM customers WHERE email = '${req.body.email}' AND password = '${req.body.pass}'`;

  db.query(q, (err, data) => {
    if (err) return res.json(err);
    else {
      if (data.length === 0) {
        return res.json("No such user exists!");
      } else {
        req.session.user = data[0];
        // res.locals.user = req.session.user;
        console.log(`Welcome ${data[0].firstname}!`);
        res.redirect("home");
      }
    }
  });
});

app.get("/menu", (req, res) => {
  const query = "SELECT * FROM menu";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    else {
      if (!req.session.user || req.session.user.id === null) {
        req.session.user = {
          id: null,
        };
      }
      res.render("menu", { user: req.session.user, data: data });
    }
  });
});

// for admin
app.post("/menu", (req, res) => {
  const q = "INSERT INTO menu (title, content, type, price) VALUES (?)";
  const values = [
    req.body.title,
    req.body.content,
    req.body.type,
    req.body.price,
  ];
  db.query(q, [values], (err, data) => {
    if (err) return res.json(err);
    else {
      console.log("Menu item has been created successfully.");
      res.redirect("menu");
    }
  });
});

app.get("/profile", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
    res.redirect("login");
  } else res.render("profile", { user: req.session.user });
});

app.get("/checkout", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
    res.redirect("login");
  } else res.render("checkout", { user: req.session.user });
});

app.get("/update_profile", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
    res.redirect("login");
  } else res.render("update_profile", { user: req.session.user });
});

app.post("/update_profile", (req, res) => {
  // kaj baki
});

app.get("/error_page", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
  } else res.render("error_page", { user: req.session.user });
});

app.get("/cart", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
    res.redirect("login");
  } else res.render("cart", { user: req.session.user });
});

app.get("/orders", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    res.redirect("login");
  } else res.render("orders", { user: req.session.user });
});

app.get("/register", (req, res) => {
  if (!req.session.user || req.session.user.id === null) {
    req.session.user = { id: null };
  }
  res.render("register", { user: req.session.user });
});

app.post("/register", (req, res) => {
  const q =
    "INSERT INTO customers (firstname, lastname, phone, address, email, password) VALUES (?)";

  const values = [
    req.body.fname,
    req.body.lname,
    req.body.number,
    req.body.address,
    req.body.email,
    req.body.pass,
  ];
  db.query(q, [values], (err, data) => {
    if (err) return res.json(err);
    else {
      console.log("customer acc creation successful");

      const q1 = `SELECT * FROM customers WHERE email = '${req.body.email}' AND password = '${req.body.pass}'`;

      db.query(q1, (err, data) => {
        if (err) return res.json(err);
        else {
          req.session.user = data[0];
          console.log(`Welcome ${data[0].firstname}!`);
          res.redirect("home");
        }
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("home");
});

app.get("/:id", (req, res) => {
  const q = `SELECT * FROM menu WHERE type = '${req.params.id}'`;

  db.query(q, (err, data) => {
    if (err) return res.json(err);
    else {
      if (!req.session.user || req.session.user.id === null) {
        req.session.user = {
          id: null,
        };
      }
      res.render("category", {
        user: req.session.user,
        data: data,
        category: req.params.id,
      });
    }
  });
});

app.listen(8800, () => {
  console.log("Connected to backend!");
});
