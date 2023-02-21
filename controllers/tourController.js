const fs = require("fs");
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.field = "name,price,ratingAverage,summary,difficulty";
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const { sort, fields, page, limit } = req.query;
  const sortBy = sort?.split(",").join(" ");
  const fieldBy = fields?.split(",").join(" ");
  const pageBy = page * 1 || 1;
  const limitBy = limit * 1 || 10;
  const skip = (pageBy - 1) * limitBy;

  const tours = await Tour.find(req.query)
    .sort(sortBy ? sortBy : "-_id")
    .select(fieldBy ? fieldBy : "-__v")
    .skip(skip)
    .limit(limitBy);

  const newTours = await Tour.countDocuments();
  if (skip >= newTours)
    return next(
      new AppError(`The page you are looking for does not exist.`, 404)
    );
  // const features = new APIFeatures(Tour.find(), req.query)
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .paginate();
  // const tours = await features.query;
  res
    .status(200)
    .json({ status: "success", results: tours.length, data: { tours } });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({_id: req.params.id})
  if (!tour) {
    return next(new AppError(`No tour found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({ status: "success", data: { tour } });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({ status: "success", data: { tour: newTour } });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError(`No tour found with id: ${req.params.id}`, 404));
  }
  return res.status(200).json({ status: "success", data: { tour } });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError(`No tour found with id: ${req.params.id}`, 404));
  }
  return res.status(204).json({ status: "success", data: null });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingQuantity" },
        avgRating: { $avg: "$ratingAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: "EASY" } },
    // },
  ]);
  res.status(200).json({ status: "success", data: { stats } });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({ status: "success", data: { plan } });
});
