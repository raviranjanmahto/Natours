const express = require("express");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(authController.protect, reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    reviewController.deleteReview
  );

module.exports = router;
