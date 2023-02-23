const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ status: "success", data: { users } });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Taking limited fields
  const { name, email, photo } = req.body;

  // 2) Update user document
  const user = await User.findById(req.user.id);

  // name and email field is required so checking by IF
  if (name) user.name = name;
  if (email) user.email = email;
  user.photo = photo;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({ status: "success", data: { user } });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: "success", data: null });
});

exports.createUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "This route is not yet defined" });
};
exports.getUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "This route is not yet defined" });
};

// Do NOT update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
