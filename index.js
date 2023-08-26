import express from "express";
import mysql from "mysql";
import bodyparser from "body-parser";
import session from "express-session";
import bcrypt from "bcryptjs";
import multer from "multer";

// File upload folder
const DEST_FOLDER = "./public/images/";

// define the storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DEST_FOLDER);
  },
  filename: (req, file, cb) => {
    //   const fileExt = path.extname(file.originalname);
    //   const fileName = file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") + "-" + Date.now();
    //   cb(null, fileName + fileExt);
    cb(null, file.originalname);
  },
});

// preapre the final multer upload object
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1048576, // 1MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .png or .jpeg format allowed."));
    }
  },
});

const app = express();

// database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "ithinkiseeu5020",
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
  })
);

app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.redirect("home");
});

app.get("/home", (req, res) => {
  const query = "SELECT * FROM menu LIMIT 6";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    else {
      const query1 = "SELECT DISTINCT type FROM menu";

      db.query(query1, (err, category) => {
        if (err) return res.json(err);
        else {
          console.log(req.session.user);
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

app.get("/staffLogin", (req, res) => {
  const errormsg = "";
  if (req.session.user) {
    if (req.session.user.role === "Admin") {
      res.redirect("adminDashboard");
    } else if (req.session.user.role === "Waiter") {
      res.redirect("waiter_orders"); /// not implemented yet
    } else {
      res.redirect("error_page");
      // res.json('You do not have access to this page')
    }
  } else res.render("staffLogin", { user: req.session.user, errormsg });
});

app.post("/staffLogin", (req, res) => {
  const { email, password } = req.body;

  const q = `SELECT * FROM staff WHERE email = '${email}'`;

  db.query(q, (err, data) => {
    if (err || data.length === 0) {
      // res.json("Wrong email!");
      const errormsg = "Wrong email";
      res.render("staffLogin", { errormsg });
    } else {
      const actualPassword = data[0].password;
      // generate a hash and checking
      bcrypt.hash(actualPassword, 10, function (err, hash) {
        bcrypt.compare(password, hash, function (err, matches) {
          if (matches) {
            req.session.user = data[0];
            console.log(req.session.user);
            console.log(req.session.user.role);
            if (req.session.user.role === "Admin") {
              res.redirect("adminDashboard");
            } else res.redirect("waiterOrders"); /// not implemented yet
          } else {
            // res.json("Wrong password!");
            const errormsg = "Wrong password";
            res.render("staffLogin", { errormsg });
          }
        });
      });
    }
  });
});

app.get("/adminAddItem", (req, res) => {
  if (req.session.user && req.session.user.role === "Admin") {
    res.render("adminAddItem", { user: req.session.user });
  } else {
    res.redirect("staffLogin");
    // res.json('You do not have access to this page')
  }
});

/* ekhane change korsi. thik ache kina ektu check kore dekhio */

app.get("/adminModifyItem", (req, res) => {
  const query = "SELECT * FROM menu";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    else {
      res.render("adminModifyItem", { user: req.session.user, data: data });
    }
  });
});

app.post("/modify", (req, res) => {
  console.log(req.body);
  const data = req.body;
  res.render("modify", req.body);
});

// app.get("/modify", (req, res) => {
//   res.render("modify", {});
// });

/* ekhane porjonto change korsi */

app.post("/adminAddItem", upload.single("image"), (req, res) => {
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
      // res.redirect('menu') ki dibo dekhte hbe
    }
  });

  console.log(req.file);
});

// default error handler
app.use((err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      res.status(500).send("There was an upload error!");
    } else {
      res.status(500).send(err.message);
    }
  } else {
    res.send("success");
  }
});

app.get("/adminOnlineOrders", (req, res) => {
  if (req.session.user && req.session.user.role === "Admin") {
    const q = "SELECT * FROM onlineOrders";
    db.query(q, (err, data) => {
      if (err) res.json(err);
      else
        res.render("adminOnlineOrders", { user: req.session.user, data: data });
    });
  } else res.json("You do not have access to this page");
});

app.get("/adminDineInOrders", (req, res) => {
  if (req.session.user && req.session.user.role === "Admin") {
    const q = "SELECT * FROM dineIns";
    db.query(q, (err, data) => {
      if (err) res.json(err);
      else
        res.render("adminDineInOrders", { user: req.session.user, data: data });
    });
  } else res.json("You do not have access to this page");
});

app.get("/adminReservations", (req, res) => {
  if (req.session.user && req.session.user.role === "Admin") {
    const q = "SELECT * FROM reservations";
    db.query(q, (err, data) => {
      if (err) res.json(err);
      else
        res.render("adminReservations", { user: req.session.user, data: data });
    });
  } else res.json("You do not have access to this page");
});

app.get("/adminDashboard", (req, res) => {
  if (req.session.user && req.session.user.role === "Admin") {
    const date =
      new Date().getMonth() +
      1 +
      "/" +
      new Date().getDate() +
      "/" +
      new Date().getFullYear();
    const dateR =
      new Date().getFullYear() +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + new Date().getDate()).slice(-2);

    const info = {
      servedOrders: 0,
      deliveredOrders: 0,
      processingOrders: 0,
      paidOrders: 0,
      total: 0,
    };

    const q1 = `SELECT * FROM reservations WHERE time LIKE '${dateR}%'`;

    db.query(q1, (err, data1) => {
      if (err) res.json("error");
      else {
        const q2 = `SELECT * FROM dineIns WHERE createdAt LIKE '${date}%'`;

        db.query(q2, (err, data2) => {
          if (err) res.json("error");
          else {
            for (let i = 0; i < data2.length; i++) {
              info.servedOrders += data2[i].status === "Served";
              info.processingOrders += data2[i].status === "Processing";
              info.paidOrders += data2[i].status === "Paid";
              if (data2[i].status === "Paid") info.total += data2[i].total;
            }

            const q3 = `SELECT * FROM onlineOrders WHERE createdAt LIKE '${date}%'`;

            db.query(q3, (err, data3) => {
              if (err) res.json("error");
              else {
                for (let i = 0; i < data3.length; i++) {
                  info.deliveredOrders += data3[i].status === "Delivered";
                  info.processingOrders += data3[i].status === "Processing";
                  info.total += data3[i].total;
                }
                res.render("adminDashboard", {
                  user: req.session.user,
                  data1: data1,
                  data2: data2,
                  data3: data3,
                  info: info,
                });
              }
            });
          }
        });
      }
    });
  } else res.json("You do not have access to this page");
});

app.post("/changeStatus", (req, res) => {
  if (req.session.user) {
    let q = "";
    if (req.session.user.role === "Admin") {
      q = `UPDATE onlineOrders SET status = '${req.body.status}' where id = ${req.body.id}`;
      db.query(q, (err, data) => {
        if (err) return res.json(err);
        else res.redirect("adminOnlineOrders");
      });
    } else {
      q = `UPDATE dineIns SET status = '${req.body.status}' where id = ${req.body.id}`;
      db.query(q, (err, data) => {
        if (err) return res.json(err);
        else res.redirect("waiterOrders");
      });
    }
  }
});

app.get("/waiterOrders", (req, res) => {
  if (req.session.user && req.session.user.role === "Waiter") {
    const date =
      new Date().getMonth() +
      1 +
      "/" +
      new Date().getDate() +
      "/" +
      new Date().getFullYear();
    const q = `SELECT * FROM dineIns where staff_id = ${req.session.user.id} AND createdAt LIKE '${date}%'`;
    db.query(q, (err, data) => {
      if (err) res.json(err);
      else res.render("waiterOrders", { user: req.session.user, data: data });
    });
  } else res.json("You do not have access to this page");
});

app.get("/login", (req, res) => {
  const errormsg = "";
  if (!req.session.user) {
    res.render("login", { user: req.session.user, errormsg });
  } else res.redirect("home");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const q = `SELECT * FROM customers WHERE email = '${email}'`;

  db.query(q, (err, data) => {
    if (err || data.length === 0) {
      // res.json("Wrong email!");
      const errormsg = "Wrong email";
      res.render("login", { errormsg });
    } else {
      const actualPassword = data[0].password;
      // generate a hash and checking
      bcrypt.hash(actualPassword, 10, function (err, hash) {
        bcrypt.compare(password, hash, function (err, matches) {
          console.log(matches);
          if (matches) {
            req.session.user = data[0];
            res.redirect("home");
          } else {
            // res.json("Wrong password!");
            const errormsg = "Wrong password";
            res.render("login", { errormsg });
          }
        });
      });
    }
  });
});

app.get("/menu", (req, res) => {
  // const query1 = "SELECT DISTINCT type FROM menu";

  // db.query(query1, (err, category) => {
  //   if (err) return res.json(err);
  //   else {
  //     const menu = [];
  //     console.log(category)
  //     for(let i=0;i<category.length;i++){
  //       const query2 = `SELECT * FROM menu WHERE type = '${category[i].type}'`;
  //       console.log(query2)
  //       db.query(query2, (err,data)=>{
  //         if(err) return res.json(err);
  //         else {
  //           for(let j=0;j<data.length;j++){
  //             console.log(data[j])
  //             menu.push({
  //               title : data[j].title,
  //               content : data[j].content,
  //               price : data[j].price,
  //               discount : data[j].price
  //             })
  //             console.log(menu.length)
  //           }

  //           res.render("menu", {
  //             user: req.session.user,
  //             category: category,
  //             menu: menu
  //           });
  //         }
  //       })
  //     }
  //   }
  // });

  const query = "SELECT * FROM menu";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    else {
      res.render("menu", { user: req.session.user, data: data });
    }
  });
});

app.get("/profile", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else res.render("profile", { user: req.session.user });
});

app.get("/update_profile", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else res.render("update_profile", { user: req.session.user });
});

app.post("/update_profile", (req, res) => {
  // kaj baki
});

app.get("/error", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else res.render("error_page", { user: req.session.user });
});

app.get("/cart", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else res.render("cart", { user: req.session.user, cart: req.session.cart });
});

app.get("/orders", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else {
    const q = `SELECT * FROM onlineOrders WHERE customer_id = ${req.session.user.id}`;

    db.query(q, (err, data) => {
      if (err) return res.json(err);
      else {
        res.render("orders", { user: req.session.user, data: data });
      }
    });
  }
});

// view not implemented yet
app.post("/waiterPrepapareOrder", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else {
    let description = "";
    let price_breakdown = "";
    let total = 0;
    for (let i = 0; i < req.session.cart.length; i++) {
      description +=
        req.session.cart[i].quantity + " x " + req.session.cart[i].title;
      if (i < req.session.cart.length - 1) description += ", ";

      price_breakdown += req.session.cart[i].subtotal;
      if (i < req.session.cart.length - 1) price_breakdown += " + ";

      total += req.session.cart[i].subtotal;

      const q = `UPDATE menu SET orderCount = orderCount+${req.session.cart[i].quantity} WHERE title = '${req.session.cart[i].title}'`;

      db.query(q, (err, data) => {
        if (err) res.json(err);
        else console.log("Order count updated");
      });
    }
    req.session.cart = [];

    const q1 = `SELECT id FROM tables WHERE availability = true ORDER BY capacity ASC`; // emnei
    db.query(q1, (err, data) => {
      if (err) res.json(err);
      else {
        const q2 = `UPDATE tables SET availability = false WHERE id = ${req.body.table_no}`;

        db.query(q2, (err, data) => {
          if (err) res.json(err);
          else {
            console.log("table assigned to customer.");
            const q3 =
              "INSERT INTO dineIns (customer_id, address, description, price_breakdown, total, createdAt, instruction, status) VALUES (?)";

            const values = [
              req.session.user.id,
              req.session.user.address,
              description,
              price_breakdown,
              total,
              new Date().toLocaleString(),
              req.body.instruction,
              "Processing",
            ];

            db.query(q3, [values], (err, data) => {
              if (err) res.json(err);
              else {
                res.redirect("waiterOrders");
              }
            });
          }
        });
      }
    });
  }
});

app.post("/checkout", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else {
    console.log(req.session.cart);
    let description = "";
    let price_breakdown = "";
    let total = 0;
    for (let i = 0; i < req.session.cart.length; i++) {
      description +=
        req.session.cart[i].quantity + " x " + req.session.cart[i].title;
      if (i < req.session.cart.length - 1) description += ", ";

      price_breakdown += req.session.cart[i].subtotal;
      if (i < req.session.cart.length - 1) price_breakdown += " + ";

      total += req.session.cart[i].subtotal;

      const q = `UPDATE menu SET orderCount = orderCount+${req.session.cart[i].quantity} WHERE title = '${req.session.cart[i].title}'`;

      db.query(q, (err, data) => {
        if (err) res.json(err);
        else console.log("Order count updated");
      });
    }
    req.session.cart = [];

    const q3 =
      "INSERT INTO onlineOrders (customer_id, address, description, price_breakdown, total, createdAt, instruction, status) VALUES (?)";

    const values = [
      req.session.user.id,
      req.session.user.address,
      description,
      price_breakdown,
      total,
      new Date().toLocaleString(),
      req.body.instruction,
      "Processing",
    ];

    db.query(q3, [values], (err, data) => {
      if (err) res.json(err);
      else {
        res.redirect("orders");
      }
    });
  }
});

app.get("/register", (req, res) => {
  if (!req.session.user) {
    res.render("register", { user: req.session.user });
  } else res.redirect("home"); // parameter
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

app.get("/makeReservation", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else res.render("makeReservation", { user: req.session.user });
});

app.post("/makeReservation", (req, res) => {
  const q1 = `SELECT id FROM tables WHERE capacity >= ${req.body.guests} AND availability = true ORDER BY capacity ASC`;
  db.query(q1, (err, data) => {
    if (err || data.length === 0) res.json("Sorry, table not available");
    else {
      const q2 = `UPDATE tables SET availability = false WHERE id = ${data[0].id}`;
      db.query(q2, (err, data) => {
        if (err) res.json(err);
        else console.log("Table booked");
      });
      const q3 =
        "INSERT INTO reservations (table_id, customer_id, guests, time) VALUES (?)";
      const values = [
        data[0].id,
        req.session.user.id,
        req.body.guests,
        req.body.time,
      ];
      db.query(q3, [values], (err, data) => {
        if (err) return res.json(err);
        else {
          console.log("Reservation has been done successfully.");
          res.redirect("home");
        }
      });
    }
  });
});

app.post("/addToCart", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else {
    console.log("adding to cart");
    console.log(req.body);
    const q = `SELECT * FROM menu WHERE id = ${req.body.id}`;

    db.query(q, (err, data) => {
      if (err) return res.json(err);
      else {
        if (!req.session.cart) {
          req.session.cart = [];
        }
        const title = data[0].title;
        const price = parseFloat(data[0].price);
        const quantity = parseInt(req.body.qty);
        const subtotal =
          (price - price * (parseFloat(data[0].discount) / 100.0)) * quantity;

        // checking if product already exists in cart

        let exists = false;

        for (let i = 0; i < req.session.cart.length; i++) {
          if (req.session.cart[i].title === title) {
            exists = true;
            req.session.cart[i].quantity =
              parseInt(req.session.cart[i].quantity) + parseInt(quantity);
            req.session.cart[i].subtotal +=
              parseFloat(price) * parseInt(quantity);
            break;
          }
        }

        if (exists === false) {
          req.session.cart.push({
            title: title,
            price: price,
            quantity: quantity,
            subtotal: subtotal,
          });
        }
        res.redirect("menu");
      }
    });
  }
});

app.get("/clearCart", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else {
    req.session.cart = [];
    res.render("cart", { user: req.session.user, cart: req.session.cart });
  }
});

app.get("/:id", (req, res) => {
  const q = `SELECT * FROM menu WHERE type = '${req.params.id}'`;

  db.query(q, (err, data) => {
    if (err) return res.json(err);
    else {
      if (data.length === 0) {
        res.redirect("error");
      } else {
        res.render("category", {
          user: req.session.user,
          data: data,
          category: req.params.id,
        });
      }
    }
  });
});

app.listen(8800, () => {
  console.log("Connected to backend!");
});
