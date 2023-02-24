const express = require("express");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router({ mergeParams: true });

// Protects all routes after this middleware.
router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.permission,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.permission,
    reviewController.deleteReview
  );

module.exports = router;
