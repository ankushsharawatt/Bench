// src/middleware/authmiddleware.js
const userModel = require("../models/usermodel");
const jwt = require("jsonwebtoken");
const tokenBlackListModel= require("../models/blacklist.model")

async function protect(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const isBlacklisted = await tokenBlackListModel.findOne({token});
  if (isBlacklisted){
    return res.status(401).json({
      message:"Unauthorised access, token expired"
    })
  }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded._id;

      if (!userId) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Unauthorized, invalid token" });
    }
}
async function systemUserMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
   const isBlacklisted = await tokenBlackListModel.findOne({token});
   if (isBlacklisted) {
     return res.status(401).json({
       message: "Unauthorised access token expired",
     });
   }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded._id;

    // ✅ CORRECT Mongoose syntax to reveal a hidden field
    const user = await userModel.findById(userId).select("+systemUser");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Now user.systemUser will correctly be true or false
    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden request: not a system user",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized, invalid token" });
  }
}

module.exports = { protect, systemUserMiddleware };
