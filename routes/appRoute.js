const express = require('express')
const router = express.Router()

// User Session
router.get("/admin/dashboard", checkNotAuthenticated, (req, res) => {
    res.render("dashboard", {
      title: "Dashboard",
      layout: "layouts/main-layout",
      username: req.user.username,
      userRole: req.user.role,
    });
  });
  
  // Page Item List
  router.get("/admin/item-list", checkNotAuthenticated, (req, res) => {
    const sql = `SELECT * FROM items ORDER BY id`;
    pool.query(sql, [], (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("item-list", {
        title: "Item List",
        layout: "layouts/main-layout",
        msg: req.flash("msg"),
        model: results.rows,
      });
    });
  });
  
  // Add Item Page
  router.get("/admin/item-list/add", checkNotAuthenticated, (req, res) => {
    res.render("add-item", {
      title: "Add Product",
      layout: "layouts/main-layout",
    });
  });
  
  // Page Item Detail
  router.get("/admin/item-list/:item_name", checkNotAuthenticated, (req, res) => {
    const sql = `SELECT * FROM items where item_name = '${req.params.item_name}'`;
    pool.query(sql, (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("item-detail", {
        title: "Item Detail",
        layout: "layouts/main-layout",
        model: results.rows[0],
        msg: req.flash("msg"),
      });
    });
  });
  
  // User list page
  router.get("/admin/user-list", checkNotAuthenticated, (req, res) => {
    const sql = `SELECT * FROM users ORDER BY username`;
    pool.query(sql, [], (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("user-list", {
        title: "User List",
        layout: "layouts/main-layout",
        msg: req.flash("msg"),
        model: results.rows,
      });
    });
  });
  
  // Page User Detail
  router.get("/admin/user-list/:username", checkNotAuthenticated, (req, res) => {
    const sql = `SELECT * FROM users where username = '${req.params.username}'`;
    pool.query(sql, (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("user-detail", {
        title: "User Detail",
        layout: "layouts/main-layout",
        model: results.rows[0],
      });
    });
  });
  
  // Add User
  router.get("/admin/addUser", checkNotAuthenticated, (req, res) => {
    res.render("addUser", {
      title: "Add User",
      layout: "layouts/main-layout",
    });
  });
  
  router.get("/logout", checkNotAuthenticated, (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      req.flash("success", `Success logged out`);
      res.redirect("/");
    });
  });
  
  router.post(
    "/admin/login",
    passport.authenticate("local", {
      successRedirect: "/admin/dashboard",
      failureRedirect: "/",
      failureFlash: true,
      successFlash: true,
    })
  );
  
  router.post("/admin/addUser", checkNotAuthenticated, async (req, res) => {
    const { username, password, role, password2 } = req.body;
  
    console.log({
      username,
      password,
      role,
    });
  
    const errors = [];
  
    if (password.length < 6) {
      errors.push({ message: "Password must be at least 6 characters" });
    }
    if (password !== password2) {
      errors.push({ message: "Password does not match" });
    }
    if (role === undefined) {
      errors.push({ message: "Please select a role" });
    }
  
    if (errors.length > 0) {
      res.render("addUser", {
        errors,
        layout: "layouts/main-layout",
        title: "Add User",
        params: req.body,
        model: results.rows,
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
  
      pool.query(
        `SELECT * FROM users WHERE username = $1`,
        [username],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            errors.push({ message: "Username already exits" });
            res.render("AddUser", {
              errors,
              layout: "layouts/main-layout",
              title: "Add User",
              params: req.body,
            });
          } else {
            const name = username.toLowerCase();
            pool.query(
              `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, password`,
              [name, hashedPassword, role],
              (err, result) => {
                if (err) {
                }
                console.log(result.rows);
                req.flash("success", "Successfully created a new user");
                res.redirect("/admin/dashboard");
              }
            );
          }
        }
      );
    }
  });
  
  router.post(
    "/admin/item-list/add",
    checkNotAuthenticated,
    upload.array("img", 1),
    async (req, res) => {
      let img;
      if (!req.files.find((e) => e.filename)) {
        img = "default.jpg";
      } else {
        img = req.files[0].filename;
      }
      const item_name = req.body.item_name;
      const category = req.body.category;
      const price = req.body.price;
      const quantity = req.body.quantity;
      console.log({
        item_name,
        category,
        price,
        quantity,
        img,
      });
  
      const errors = [];
  
      if (img === undefined) {
        errors.push({ message: "Please insert an image" });
      }
      if (category === undefined) {
        errors.push({ message: "Please select a category" });
      }
  
      if (quantity < 0 || quantity === "") {
        errors.push({ message: "Invalid amount of quantity" });
      }
  
      if (price < 0 || quantity === "") {
        errors.push({ message: "Invalid amount of price" });
      }
  
      if (errors.length > 0) {
        res.render("add-item", {
          errors,
          layout: "layouts/main-layout",
          title: "Add Item",
          params: req.body,
        });
      } else {
        pool.query(
          `SELECT * FROM items WHERE item_name = $1`,
          [item_name.toLowerCase()],
          (err, results) => {
            if (err) {
              throw err;
            }
            console.log(results.rows);
  
            if (results.rows.length > 0) {
              errors.push({ message: "Product name already exists" });
              res.render("add-item", {
                errors,
                layout: "layouts/main-layout",
                title: "Add Item",
                params: req.body,
              });
            } else {
              const product = item_name.toLowerCase();
              pool.query(
                "INSERT INTO items (item_name, category, price, quantity, item_image) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                [product, category, price, quantity, img],
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  console.log(results.rows);
                  req.flash("success", "Successfully create a product");
                  res.redirect("/admin/item-list");
                }
              );
            }
          }
        );
      }
    }
  );
  
  // Edit data product
  router.get("/admin/item-list/edit/:item_name", (req, res) => {
    const sql = `SELECT * FROM items where item_name = '${req.params.item_name}'`;
    pool.query(sql, (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("item-edit", {
        title: "Edit Data Product",
        layout: "layouts/main-layout",
        model: result.rows[0],
      });
    });
  });
  
  router.post(
    "/admin/item-list/update",
    checkNotAuthenticated,
    upload.array("img", 1),
    async (req, res) => {
      let img;
      if (!req.files.find((e) => e.filename)) {
        img = "default.jpg";
      } else {
        img = req.files[0].filename;
      }
      const item_name = req.body.item_name;
      const category = req.body.category;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const oldName = req.body.oldName;
      console.log({
        oldName,
        item_name,
        category,
        price,
        quantity,
        img,
      });
  
      const errors = [];
  
      if (img === undefined) {
        errors.push({ message: "Please insert an image" });
      }
      if (category === undefined) {
        errors.push({ message: "Please select a category" });
      }
  
      if (quantity < 0 || quantity === "") {
        errors.push({ message: "Invalid amount of quantity" });
      }
  
      if (price < 0 || quantity === "") {
        errors.push({ message: "Invalid amount of price" });
      }
  
      if (errors.length > 0) {
        res.render("add-item", {
          errors,
          layout: "layouts/main-layout",
          title: "Add Item",
          params: req.body,
        });
      } else {
        pool.query(
          `SELECT * FROM items WHERE item_name = $1`,
          [item_name],
          (err, results) => {
            if (err) {
              throw err;
            } else {
              console.log(results.rows);
              const product = item_name;
              pool.query(
                `UPDATE items SET item_name = '${product}', category = '${category}', price = '${price}', quantity = '${quantity}', item_image = '${img}' WHERE item_name='${oldName}'; `,
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  console.log(results.rows);
                  req.flash("success", "Successfully create a product");
                  res.redirect("/admin/item-list");
                }
              );
            }
          }
        );
      }
    }
  );
  
  // Delete Product
  router.get(
    "/admin/item-list/delete/:item_name",
    checkNotAuthenticated,
    (req, res) => {
      const item = req.params.item_name;
      pool.query(
        `SELECT item_name FROM items where item_name = '${item}'`,
        (err, results) => {
          if (err) {
            throw err;
          }
          if (results.rows.length < 1) {
            req.flash("error", "Product not found");
            res.redirect("/admin/item-list");
          } else {
            const sql = `DELETE FROM items where item_name = '${item}'`;
            pool.query(sql, (err, result) => {
              if (err) {
                return console.error(err.message);
              } else {
                console.log(results.rows);
                req.flash("success", "Successfully Delete a product");
                res.redirect("/admin/item-list");
              }
            });
          }
        }
      );
    }
  );
  
  
  
  // Page Item Listtory
  router.get("/admin/item-history", checkNotAuthenticated, (req, res) => {
    const sql = `SELECT *  FROM history_product ORDER BY id `;
    pool.query(sql, [], (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("item-history", {
        title: "Item List",
        layout: "layouts/main-layout",
        msg: req.flash("msg"),
        model: results.rows,
      });
    });
  });

  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/admin/dashboard");
    }
    next();
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  module.exports = router;