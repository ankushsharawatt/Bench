const express = require("express");
const authmiddleware = require("../middleware/authmiddleware");
const transactioncontroller =require("../controller/transactioncontroller")
const Transactionroutes = express.Router();


/**
 * POST api/transactions/
 * create new transcation
 */
Transactionroutes.post(
  "/",
  authmiddleware.protect,
  transactioncontroller.createTransaction,
);

/**
 * POST api/transactions/system/initial-funds
 * create initial funds transaction from system user
 */

Transactionroutes.post(
  "/system/initial-funds",
  authmiddleware.systemUserMiddleware,
  transactioncontroller.createInitialFundsTransaction,
);


module.exports = Transactionroutes;
