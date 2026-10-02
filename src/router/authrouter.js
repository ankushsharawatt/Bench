const express = require("express");
const authcontroller = require("../controller/authcontroller");
const router = express.Router();

router.post("/register", authcontroller.registerUser);
router.post("/login", authcontroller.login);
router.post("/logout", authcontroller.logout);
module.exports = router;
