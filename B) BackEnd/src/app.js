const express = require('express');
const cors = require("cors");
const path = require('path');

const Razorpay = require("razorpay");
const crypto = require("crypto");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(cors());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,'..', '..', 'A) FrontEnd', 'Markup(HTML)'));

app.use(express.static(path.join(__dirname,'..','..','A) FrontEnd')));

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.post("/create-order", async (req, res) => {
    try {
        const options = {
            amount: 1000, // Amount in paise (10rs = 1000 paise)
            currency: "INR"
        };
        const order = await razorpay.orders.create(options);
        
        // Option 1: Send the Razorpay Key ID to the frontend along with the order
        res.json({
            ...order,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/verify-payment", (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;

    const generated_signature = crypto
        // FIX: The signature must be generated using the SECRET, not the ID
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) 
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex")
    ;

    if (generated_signature === razorpay_signature) {
        const token = jwt.sign(
            {
                premium: true
            },
            process.env.SECRET_TOKEN,
            {
                expiresIn: "30d"
            }
        );

        res.cookie("session_token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        return res.json({
            success: true,
            message: "Payment Verified & Access Granted"
        });

    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid Signature"
        });
    }
});

app.use('/', (req, res, next) => {
    const token = req.cookies.session_token;
    if (!token) {
        return res.render('!payment');
    } else {
        try {
            jwt.verify(token, process.env.SECRET_TOKEN);
            next();
        } catch {
            console.log("TOKEN INVALID");
            return res.render('!payment');
        }
    }
});

app.get('/', (req, res) => {
    res.render('home');
});
app.use('/', require('./routes'));

module.exports = app;