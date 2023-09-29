const multer = require("multer");
const sharp = require("sharp");
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    new AppError("Not an image! Please upload only images.", 400), false;
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // 1) COVER IMAGES
  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // 2) IMAGES
  if (req.files.images) {
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(700, 700)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);
        req.body.images.push(filename);
      })
    );
  }

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.field = "name,price,ratingAverage,summary,difficulty";
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const { sort, fields, page, limit } = req.query;
//   const sortBy = sort?.split(",").join(" ");
//   const fieldBy = fields?.split(",").join(" ");
//   const pageBy = page * 1 || 1;
//   const limitBy = limit * 1 || 10;
//   const skip = (pageBy - 1) * limitBy;

//   const tours = await Tour.find(req.query)
//     .sort(sortBy ? sortBy : "-_id")
//     .select(fieldBy ? fieldBy : "-__v")
//     .skip(skip)
//     .limit(limitBy);

//   const newTours = await Tour.countDocuments();
//   if (skip >= newTours)
//     return next(
//       new AppError(`The page you are looking for does not exist.`, 404)
//     );
//   res
//     .status(200)
//     .json({ status: "success", results: tours.length, data: { tours } });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate("reviews");
//   // Tour.findOne({_id: req.params.id})
//   if (!tour) {
//     return next(new AppError(`No tour found with id: ${req.params.id}`, 404));
//   }
//   res.status(200).json({ status: "success", data: { tour } });
// });

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour); //Only for Admin
exports.deleteTour = factory.deleteOne(Tour); //Only for Admin

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

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  // Unit in miles else in kilometer
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng)
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res
    .status(200)
    .json({ status: "success", results: tours.length, data: { data: tours } });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  // Unit in miles else in kilometer
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng)
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({ status: "success", data: { data: distances } });
});
