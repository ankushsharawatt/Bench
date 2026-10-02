const express = require("express");
const accountcontroller = require("../controller/accountcontroller");
const authmiddleware = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authmiddleware.protect, accountcontroller.createAccount);
router.get(
  "/",
  authmiddleware.protect,
  accountcontroller.getUserAccountController,
);
router.get(
  "/balance/:accountid",
  authmiddleware.protect,
  accountcontroller.getAccountBalance,
);

module.exports = router;
