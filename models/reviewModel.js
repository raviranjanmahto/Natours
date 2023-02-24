const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "A rating must be above 1.0"],
      max: [5, "A rating must be below 5.0"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Not allowing duplicate review on same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: "tour",
  //     select: "name",
  //   }).populate({
  //     path: "user",
  //     select: "name photo",
  //   });
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

// Calculating average rating review on tour.
reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        numRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].numRating,
      ratingAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingAverage: 4.5,
    });
  }
};

reviewSchema.post("save", function () {
  // This point to current review
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (docs) {
  await docs.constructor.calcAverageRating(docs.tour);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
