const mongoose = require("mongoose");
const userModel = require("../models/usermodel");
const jwt = require("jsonwebtoken");
const emailService =require("../services/email.service");
const tokenBlackListModel =require("../models/blacklist.model")

async function registerUser(req, res) {
  try {
    const { email, password, name } = req.body;
    const isExist = await userModel.findOne({ email: email });
    if (isExist) {
      return res.status(422).json({
        message: "User Already exist",
        status: "Failed",
      });
    }
    const user = await userModel.create({
      email,
      password,
      name,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
 await emailService.sendRegisteredEmail(user.email, user.name);
    return res.status(201).json({
      message: "User register successfully",
      user:{
        _id:user._id,
        email:user.email,
        name:user.name,
      },
      token,
     
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}


async function login(req,res){
  const {email,password}= req.body;
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({
      message: "Invalid Creditinals",
    });
  }

  const isvalidPassword = await user.comparePassword(password);
  if (!isvalidPassword) {
    return res.status(401).json({
      message: "Invalid Creditinals",
    });
  }
  const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET,);
  res.cookie("token",token);
  res.status(201).json({
    user:{
      _id:user._id,
      email:user.email,
      name:user.name,

    },
    token,
    
  });


}

async function logout(req, res) {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    await tokenBlackListModel.create({ token });
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.clearCookie("token");
      return res.status(200).json({ message: "Logged out successfully" });
    }

    return res
      .status(500)
      .json({ message: "Logout failed", error: error.message });
  }
}

module.exports = { registerUser, login, logout };
