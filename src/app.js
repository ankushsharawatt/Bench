require("dotenv").config(); // MUST be at the very top line of your entry file
const express = require("express");

const cookieParser = require("cookie-parser");
const authrouter = require("./router/authrouter");
const accountrouter = require("../src/router/accountrouter");
const Transactionroutes = require("./router/transactionrouter")
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authrouter);
app.use("/api/accounts", accountrouter);
app.use("/api/transactions",Transactionroutes);


module.exports = app;
