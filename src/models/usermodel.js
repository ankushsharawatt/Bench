const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // 1. Added missing bcrypt import

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, "Email is required"],
      unique: true, // 2. Added unique constraint
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    name: {
      type: String,
      required: [true, "Please enter a valid username"],
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters long"],
      // Removed maxLength: 20 here because bcrypt outputs 60 characters
      select: false,
    },

    systemUser:{
      type:Boolean,
      default:false,
      immutable:true,
      select:false


    }
  },
  { timestamps: true },
);

// Pre-save hook to hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    throw error; // 3. Bubble error up instead of swallowing it silently
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  // When password has `select: false`, you must explicitly fetch it
  // via `.select("+password")` in your query before calling this method.
  return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel;
