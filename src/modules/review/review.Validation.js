import joi from "joi";
import { generalFiled } from "../../middleware/validation.js";

export const createReviewProperty = joi
  .object({
    propertyId: generalFiled.id.required(),
    comment: joi.string().required(),
    rate: joi.number().integer().positive().min(1).max(5).required(),
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    })
  })
  .required();
export const createReviewOwner = joi
  .object({
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    }),
    ownerId: generalFiled.id.required(),
    comment: joi.string().required(),
    rate: joi.number().integer().positive().min(1).max(5).required()
  })
  .required();

export const updateReview = joi
  .object({
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    }),
    reviewId: generalFiled.id.required(),
    comment: joi.string().optional(),
    rate: joi.number().integer().positive().min(1).max(5).optional()
  })
  .required();

export const deleteReview = joi
  .object({
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    }),
    reviewId: generalFiled.id.required(),
  })
  .required();
