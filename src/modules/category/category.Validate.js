import joi from "joi";
import { generalFiled } from "../../middleware/validation.js";

export const createCategory = joi
  .object({
    nameAR: joi.string().min(2).max(30).required(),
    nameEN: joi.string().min(2).max(30).required(),
    facilities: joi.array().items(joi.string().required()).single().required(),
    file: generalFiled.file.optional(),
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    })
  })
  .required();

export const updateCategory = joi
  .object({
    nameAR: joi.string().min(2).max(30).optional(),
    nameEN: joi.string().min(2).max(30).optional(),
    facilities: joi.array().items(joi.string().optional()).single().optional(),
    file: generalFiled.file.optional(),
    categoryId: generalFiled.id.required(),
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    })
  })
  .required();

export const deleteCategory = joi.object({
  categoryId: generalFiled.id.required(),
  ln: joi.string().valid('en', 'ar').required().messages({
    'any.required': 'Language is required.',
    'string.base': 'Language must be a string.',
    'any.only': 'Language must be either "en" or "ar".'
  })
}).required();

export const languageAndId = joi.object({
  ln: generalFiled.ln,
  categoryId: generalFiled.id.required(),
}).required()


export const language = joi.object({
  ln: generalFiled.ln
}).required()
