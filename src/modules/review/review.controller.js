import propertyModel from "../../../DB/models/property.model.js";
import reviewModel from "../../../DB/models/review.model.js";
import rentModel from "../../../DB/models/rent.model.js";
import { AppError, asyncHandler } from "../../utils/globalError.js";
import ownerModel from "../../../DB/models/owner.model.js";
import { allMessages } from "../../utils/localizationHelper.js";
import { LoginTicket } from "google-auth-library";
import { selectOwner, selectProperty } from './../owner/owner.controller.js';

export const selectReview = "comment rate userId propertyId ownerId"
// *******************************createReview property*********************************//
export const createReviewProperty = asyncHandler(async (req, res, next) => {
  const { comment, rate } = req.body;
  const { propertyId } = req.params;

  //check property exist or not 
  const property = await propertyModel.findById(propertyId);
  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  //check rent it or not first
  const rent = await rentModel.findOne({
    userId: req.user._id,
    "property.propertyId": propertyId,
    status: "done",
    accepted: true
  });
  if (!rent) {
    return next(new AppError(allMessages[req.query.ln].REVIEW_WITH_OUT_TRY, 401));
  }

  // check make review or not before 
  const review = await reviewModel.findOne({ userId: req.user._id, propertyId });

  if (review) {
    return next(new AppError(allMessages[req.query.ln].REVIEW_AGAIN, 401));
  }
  const addreview = await reviewModel.create({
    userId: req.user._id,
    propertyId,
    comment,
    rate
  });


  let newRate = ((property.rate * property.numberOfRates) + rate) / (++property.numberOfRates)
  await propertyModel.updateOne({ _id: propertyId }, {
    rate: newRate,
    $inc: { numberOfRates: 1 }
  });
  return res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_REVIEW });
})


////////////////////////update review property ////////////////////////
export const updateReviewProperty = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params
  const { rate, comment } = req.body
  const review = await reviewModel.findById(reviewId)
  //delete review
  if (!review) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND_REVIEW, 404))
  }
  if (review.userId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].NOT_AUTHORIZED, 401))
  }
  //update rate property
  const property = await propertyModel.findById({ _id: review.propertyId });
  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  //check rate & comment
  if (rate) {

    let newRate = ((property.rate * property.numberOfRates - review.rate) + rate) / (property.numberOfRates)
    await propertyModel.updateOne({ _id: review.propertyId }, {
      rate: newRate,
    });
    review.rate = rate
  }
  if (comment) {
    review.comment = comment
  }
  await review.save()
  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED })
})

////////////////////////delete review property ////////////////////////
export const deleteReviewProperty = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params
  const review = await reviewModel.findById(reviewId)
  //delete review
  if (!review) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND_REVIEW, 404))
  }
  if (review.userId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].NOT_AUTHORIZED, 401))
  }
  //delete rate from property
  const property = await propertyModel.findById({ _id: review.propertyId });
  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404))
  }
  let newRate = (property.rate * property.numberOfRates - review.rate) / (--property.numberOfRates)
  await propertyModel.updateOne({ _id: review.propertyId }, {
    rate: newRate || 0,
    $inc: { numberOfRates: -1 }
  });
  await reviewModel.deleteOne({ _id: reviewId })
  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_DELETED })
})



// ============================================================================================== //

// *******************************create Review Owner*********************************//
export const createReviewOwner = asyncHandler(async (req, res, next) => {
  const { comment, rate } = req.body;
  const { ownerId } = req.params;
  //check rent it or not first
  const rent = await rentModel.findOne({
    userId: req.user._id,
    "property.ownerId": ownerId,
    status: "done",
    accepted: true
  });
  if (!rent) {
    return next(new AppError(allMessages[req.query.ln].REVIEW_WITH_OUT_TRY, 401));
  }
  //check owner exist or not 
  const owner = await ownerModel.findById(ownerId);
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 401));
  }
  //check make review or not before 
  const review = await reviewModel.findOne({ userId: req.user._id, ownerId });

  if (review) {
    return next(new AppError(allMessages[req.query.ln].REVIEW_AGAIN, 401));
  }
  const addreview = await reviewModel.create({
    userId: req.user._id,
    ownerId,
    comment,
    rate
  });
  let newRate = ((owner.rate * owner.numberOfRates) + rate) / (++owner.numberOfRates)
  await ownerModel.updateOne({ _id: ownerId }, {
    rate: newRate,
    $inc: { numberOfRates: 1 }
  });
  return res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_REVIEW });
});

// *******************************update Review Owner*********************************//

export const updateReviewOwner = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params
  const { rate, comment } = req.body
  const review = await reviewModel.findById(reviewId)
  //delete review
  if (!review) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND_REVIEW, 404))
  }
  if (review.userId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].NOT_AUTHORIZED, 401))
  }
  //update rate owner
  const owner = await ownerModel.findById({ _id: review.ownerId });
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  //check rate & comment
  if (rate) {
    let newRate = ((owner.rate * owner.numberOfRates - review.rate) + rate) / (owner.numberOfRates)
    await ownerModel.updateOne({ _id: review.ownerId }, {
      rate: newRate,
    });
    review.rate = rate
  }
  if (comment) {
    review.comment = comment
  }
  await review.save()
  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED })
})

//////////////////////// delete Review Owner ////////////////////////
export const deleteReviewOwner = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params

  const review = await reviewModel.findById(reviewId)
  //delete review
  if (!review) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND_REVIEW, 404))
  }
  if (review.userId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].NOT_AUTHORIZED, 401))
  }
  //delete rate from owner
  const owner = await ownerModel.findById({ _id: review.ownerId });
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404))
  }
  let newRate = (owner.rate * owner.numberOfRates - review.rate) / (--owner.numberOfRates)
  await ownerModel.updateOne({ _id: review.ownerId }, {
    rate: newRate || 0,
    $inc: { numberOfRates: -1 }
  });
  await reviewModel.deleteOne({ _id: reviewId })
  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_DELETED })
})


//* ========================================================================================= //

export const getReviews = async (req, res, next) => {
  const filter = {}
  const id = req.params.id
  if (req.originalUrl.includes('property')) {
    const property = await propertyModel.findById(id)
    if (!property) {
      return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404))
    }
    filter.propertyId = id
  }
  if (req.originalUrl.includes('owner')) {
    const owner = await ownerModel.findById(id)
    if (!owner) {
      return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404))
    }
    filter.ownerId = id
  }
  if (req.query.rate) {
    filter.rate = req.query.rate
  }
  const reviews = await reviewModel.find(filter).select(selectReview).populate([{
    path: 'ownerId',
    select: selectOwner
  }, {
    path: 'propertyId',
    select: selectProperty

  }])
  res.json({ message: allMessages[req.query.ln].SUCCESS, reviews })
}