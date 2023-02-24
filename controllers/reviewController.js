const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");

// Setting Tour User ID in createReview
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review); //Only for Admin
exports.deleteReview = factory.deleteOne(Review); //Only for Admin
