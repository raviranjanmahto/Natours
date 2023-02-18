const fs = require("fs");
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.field = "name,price,ratingAverage,summary,difficulty";
  next();
};

exports.getAllTours = async (req, res) => {
  try {
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
      throw new Error("The page you are looking for does not exist!");
    // const features = new APIFeatures(Tour.find(), req.query)
    //   .filter()
    //   .sort()
    //   .limitFields()
    //   .paginate();
    // const tours = await features.query;
    res.status(200).json({
      status: "success",
      results: tours.length,
      data: { tours },
    });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error.message });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({_id: req.params.id})
    if (!tour) {
      return res.status(404).json({
        status: "fail",
        message: `No tour found with id ${req.params.id}`,
      });
    }
    res.status(200).json({ status: "success", data: { tour } });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({ status: "success", data: { tour: newTour } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ status: "success", data: { tour } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    return res.status(204).json({ status: "success", data: null });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
