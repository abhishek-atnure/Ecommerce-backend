const pool = require("./db");
const bcrypt = require('bcrypt');


const getAllProducts = async (req, res) => {
    try {
        const getAllProducts = await pool.query('SELECT * FROM product');
        res.json(getAllProducts.rows);
    } catch (err) {
        console.log(err.message);
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const getProduct = await pool.query('SELECT * FROM product WHERE id=$1', [id]);
        res.json(getProduct.rows[0]);

    } catch (err) {
        console.log(err.message)
    }
};

const getAllCategory = async (req, res) => {
    try {
        const getCategory = await pool.query("SELECT name FROM category");
        res.send(getCategory.rows);
    } catch (error) {
        console.log(error.message)
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const getProductsByCategory = await pool.query(
            'select product.name, product.description,product.price from product JOIN category ON product.category_id=category.id WHERE product.category_id=$1', [category_id]);
        res.json(getProductsByCategory.rows)
    } catch (error) {
        console.log(error.message)
    }
};

const register = async (req, res, next) => {
    try {
        const { user_name, name, password, contact_num } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const createUser = await pool.query(
            `WITH results as (INSERT INTO account(user_name,name,password,contact_num)VALUES($1,$2,$3,$4) 
  returning id as user_id)
  insert into cart(user_id)
  select user_id from results RETURNING id`, [user_name, name, hashedPassword, contact_num]);
        res.json(createUser.rows);
        res.redirect('/cart');

    } catch (err) {
        console.log(err.message);
    }

};

const updateExistingUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const updateUser = await pool.query(
            "UPDATE account SET password=$1,name=$2  WHERE id=$3 RETURNING *", [hashedPassword, name, id]);
        res.json(updateUser.rows);
    } catch (err) {
        console.log(err.message);
    }
};

const creatingCartId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const cart = await pool.query(
            `INSERT INTO cart(user_id) VALUES($1) RETURNING id`, [user_id]
        );
        res.json(cart.rows)
    } catch (err) {
        console.log(err.message);
    }
};

const addingProductsToCart = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const { product_id, quantity } = req.body;
        const cartCreate = await pool.query(
            `INSERT INTO cart_product(cart_id,product_id,quantity,status,price) 
        VALUES($1,$2,$3,'current',(
          SELECT product.price*$4 
        FROM product where id=$5))
        RETURNING cart_id`, [cart_id, product_id, quantity, quantity, product_id]
        );
        res.json(cartCreate.rows);

    } catch (error) {
        console.log(error.message);
    }
};

const gettingCartById = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const gettingCart = await pool.query(
            "SELECT product.name AS Name, product.description AS Description, product.price*cart_product.quantity as Price, cart_product.quantity as Quantity, product.price*cart_product.quantity as Total_Price FROM product,cart_product WHERE product.id=cart_product.product_id AND cart_product.cart_id=$1 AND cart_product.status='current'", [cart_id])
        res.json(gettingCart.rows)
    } catch (err) {
        console.log("no products into cart")
    }
};

const removeProductInCart = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const { product_id } = req.body;
        const removeOneProduct = await pool.query(
            `UPDATE cart_product
        SET quantity=quantity-1
        WHERE cart_id=$1
            AND 
        product_id=$2 RETURNING quantity` , [cart_id, product_id]
        );
        res.json(removeOneProduct.rows)
    } catch (err) {
        console.log(err.message)
    }
};

const checkout = async (req, res) => {
    try {
        const { cart_id, user_id } = req.params;
        const { address } = req.body;
        const results = await pool.query(
            `with row as (
                INSERT INTO orders(customer_id,cart_id,amount,address,order_status)
                VALUES($1,$2,
               (select sum(price) FROM cart_product WHERE cart_id=$3),
               $4,'purchased') RETURNING id
        )
        UPDATE cart_product
        SET status='proceed',
         order_id=(select id from row limit 1)
        WHERE cart_id=$5 RETURNING cart_id as id`, [user_id, cart_id, cart_id, address, cart_id])
        res.json(results.rows);
    } catch (err) {
        console.log(err.message);

    }
};

const deleteCart = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const deletedCart = await pool.query(
            `delete from cart_product
        where cart_id=$1`, [cart_id]
        );
        res.json('Cart removed')
    } catch (err) {
        console.log(err.message);
    }
};

const getAllOrders = async (req, res) => {
    try {
        const { cart_id, user_id } = req.params;

        const allOrders = await pool.query(
            `select 
            cart_product.cart_id,name,description,
            cart_product.price,cart_product.quantity 
            from product,cart_product,orders
            where product.id=cart_product.product_id
                and 
            order_id in (select id from orders where customer_id=$1 )
            group by 
                cart_product.cart_id,name, 
                description, 
                cart_product.price,
                cart_product.quantity`, [user_id]
        );
        res.json(allOrders.rows)
    } catch (err) {
        console.log(err.message)
    }
}

const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await pool.query(
            `select 
            cart_product.cart_id,name,description,
            cart_product.price,cart_product.quantity 
            from product,cart_product,orders
            where product.id=cart_product.product_id
                and 
            order_id in (select id from orders where cart_id=$1 )
            group by 
                cart_product.cart_id,name, 
                description, 
                cart_product.price,
                cart_product.quantity`, [id]
        );
        res.json(order.rows)
    } catch (err) {
        console.log(err.message)
    }
}

module.exports = {
    getAllProducts,
    getProductById,
    getAllCategory,
    getProductsByCategory,
    register,
    updateExistingUser,
    creatingCartId,
    addingProductsToCart,
    gettingCartById,
    removeProductInCart,
    checkout,
    deleteCart,
    getAllOrders,
    getOrder
}

