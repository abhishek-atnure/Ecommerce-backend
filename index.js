const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const flash = require('express-flash');
const passport = require("passport");
const pool = require("./db");
const bcrypt = require("bcrypt");

const initializePassport = require("./passportConfig");
const queries = require('./queries')

initializePassport(passport);


const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());


//*****PRODUCTS *****
//get all products
app.get('/products', queries.getAllProducts)
//get a product
app.get('/products/:id', queries.getProductById)

//CATEGORIES
//get categories
app.get('/category', queries.getAllCategory)
//get products by category
app.get('/category/:category_id', queries.getProductsByCategory)

// USERS
//creating user_name and password
app.post('/register', queries.register);
//login page
app.post("/login", passport.authenticate('local', {
  successRedirect: '/products',
  failureRedirect: '/login',
  failureFlash: true
}));
//updating user_name
app.put('/users/:id', queries.updateExistingUser)

//CART 
app.post('/cart/:user_id', queries.creatingCartId)
//add products to cart
app.post('/cart/:cart_id/', queries.addingProductsToCart)
//display current cart
app.get('/cart/:cart_id', queries.gettingCartById)
//update current cart
app.put('/cart/:cart_id', queries.removeProductInCart)
//delete whole cart
app.delete('/cart/:cart_id', queries.deleteCart)
//checkout page to buy
app.post('/cart/:cart_id/checkout', queries.checkout)



//orders
//gettting all orders made by a customer
app.get('/orders', queries.getAllOrders)

//getting specific order
app.get('/orders/:id', queries.getOrder)


//port will listen
app.listen(PORT, () => {
  console.log(`connnected to port ${PORT}`);
})



