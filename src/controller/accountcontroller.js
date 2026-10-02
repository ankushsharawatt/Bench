const mongoose = require("mongoose");
require("../models/accountmodel");

async function createAccount(req, res) {
  try {
    const Account = mongoose.model("account");
    const user = req.user;

    const account = await Account.create({
      user: user._id,
    });

    return res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    console.error("Create Account Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create account", error: error.message });
  }
}

async function getUserAccountController(req, res) {
  try {
    const Account = mongoose.model("account");
    const accounts = await Account.find({ user: req.user._id });

    return res.status(200).json({
      user: req.user._id,
      name: req.user.name,
      accounts,
    });
  } catch (error) {
    console.error("Get User Accounts Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch accounts", error: error.message });
  }
}

async function getAccountBalance(req, res) {
  try {
    const Account = mongoose.model("account");
    // MATCH THIS to your route definition (lowercase 'i')
    const { accountid } = req.params;

    // FIXED: Changed 'id' to '_id'
    const account = await Account.findOne({
      _id: accountid,
      user: req.user._id,
    });

    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or does not belong to you" });
    }

    // No session needed here since this is just a standard read request
    const balance = await account.getBalance();

    return res.status(200).json({
      accountId: account._id,
      balance: balance,
    });
  } catch (error) {
    console.error("Get Balance Error:", error);
    // Handle invalid ObjectId format cleanly without crashing
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid account ID format" });
    }
    return res
      .status(500)
      .json({ message: "Failed to fetch balance", error: error.message });
  }
}

module.exports = { createAccount, getAccountBalance, getUserAccountController };
