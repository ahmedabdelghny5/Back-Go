import { Router } from "express";
import * as RC from "./review.controller.js";
import { validation } from "../../middleware/validation.js";
import * as RV from "./review.Validation.js";
import { auth, role } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/globalError.js";
const router = Router({ mergeParams: true });

router.post(
  "/review-property",
  validation(RV.createReviewProperty),
  auth(role.User),
  RC.createReviewProperty
);
router.post(
  "/review-owner",
  validation(RV.createReviewOwner),
  auth(role.User),
  RC.createReviewOwner
);

router.put(
  "/review-property/:reviewId",
  validation(RV.updateReview),
  auth(role.User),
  RC.updateReviewProperty
);
router.put('/review-owner/:reviewId',
  validation(RV.updateReview),
  auth(role.User),
  RC.updateReviewOwner
);





router.delete(
  "/review-property/:reviewId",
  auth(role.User),
  validation(RV.deleteReview),
  RC.deleteReviewProperty
);
router.delete('/review-owner/:reviewId',
  auth(role.User),
  validation(RV.deleteReview),
  RC.deleteReviewOwner
);




router.get('/property/:id', asyncHandler(RC.getReviews))
router.get('/owner/:id', asyncHandler(RC.getReviews))
export default router;
