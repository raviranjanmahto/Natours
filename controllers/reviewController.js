const Review = require("../models/reviewModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

// Setting Tour User ID in createReview
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.permission = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (req.user.role !== "admin") {
    if (review.user.id !== req.user.id)
      return next(
        new AppError(`You do not have permission to perform this action.`, 403)
      );
  }
  next();
});

exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review); //Only for Admin
exports.deleteReview = factory.deleteOne(Review); //Only for Admin
