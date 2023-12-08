import joi from "joi";
import { generalFiled } from "../../middleware/validation.js";

export const createSubCategory = joi
  .object({
    nameEN: joi.string().min(2).max(30).required(),
    nameAR: joi.string().min(2).max(30).required(),
    file: generalFiled.file.optional(),
    categoryId: generalFiled.id.required(),
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    }),

  }).required();

export const updateSubCategory = joi
  .object({
    nameEN: joi.string().min(2).max(30).optional(),
    nameAR: joi.string().min(2).max(30).optional(),
    file: generalFiled.file.optional(),
    subCategoryId: generalFiled.id.required(),
    categoryId: generalFiled.id.required(),
    ln: joi.string().valid('en', 'ar').required().messages({
      'any.required': 'Language is required.',
      'string.base': 'Language must be a string.',
      'any.only': 'Language must be either "en" or "ar".'
    }),

  }).required();


export const deleteSubCategory = joi.object({
  subCategoryId: generalFiled.id.required(),
  ln: joi.string().valid('en', 'ar').required().messages({
    'any.required': 'Language is required.',
    'string.base': 'Language must be a string.',
    'any.only': 'Language must be either "en" or "ar".'
  }),

}).required();

export const languageAndCatId = joi.object({
  ln: generalFiled.ln,
  categoryId: generalFiled.id.required(),
}).required()

export const languageAndSubId = joi.object({
  ln: generalFiled.ln,
  subCategoryId: generalFiled.id.required(),
}).required()

export const languageAndIds = joi.object({
  ln: generalFiled.ln,
  categoryId: generalFiled.id.required(),
  subCategoryId: generalFiled.id.required(),
}).required()


export const language = joi.object({
  ln: generalFiled.ln
}).required()