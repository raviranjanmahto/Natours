const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    trim: true,
    maxlength: [70, "A user name must have less or equal than 70 characters "],
    minlength: [2, "A user name must have more or equal than 2 characters "],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  password: {
    type: String,
    minlength: [6, "Password must be at least 6 character"],
    required: [true, "Password is required!"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Confirm password is required!"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Confirm password are not match!",
    },
  },
});

userSchema.pre("save", async function (next) {
  // Only run this function when password is actually modified!
  if (!this.isModified("password")) return next();

  //   Hash the password with cost of 11
  this.password = await bcrypt.hash(this.password, 11);

  //   Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
