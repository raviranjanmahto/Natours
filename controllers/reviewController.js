const Review = require("../models/reviewModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getAllReview = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const review = await Review.find(filter);
  res
    .status(200)
    .json({ status: "success", results: review.length, data: { review } });
});

// Setting Tour User ID in createReview
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review); //Only for Admin
exports.deleteReview = factory.deleteOne(Review); //Only for Admin
