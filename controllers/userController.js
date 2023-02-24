const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

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
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined, Please use /signup instead!",
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Do NOT update password with this
exports.updateUser = factory.updateOne(User); //Only for Admin
exports.deleteUser = factory.deleteOne(User); //Only for Admin
