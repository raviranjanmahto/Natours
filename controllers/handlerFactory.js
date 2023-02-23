const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// This whole implementation is for ADMIN only.
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`No document found with id: ${req.params.id}`, 404)
      );
    }
    return res.status(204).json({ status: "success", data: null });
  });

// This whole implementation is for ADMIN only.
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(
        new AppError(`No document found with id: ${req.params.id}`, 404)
      );
    }
    return res.status(200).json({ status: "success", data: { data: doc } });
  });

// This whole implementation is for ADMIN only.
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ status: "success", data: { data: doc } });
  });

// This whole implementation is for ADMIN only.
exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);
    const doc = await query;
    if (!doc) {
      return next(
        new AppError(`No document found with id: ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ status: "success", data: { data: doc } });
  });
