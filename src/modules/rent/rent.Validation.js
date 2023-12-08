import joi from "joi";
import { generalFiled } from "../../middleware/validation.js";

export const createrent = joi.object({
  fromDate: joi.date().greater(Date.now()).required(),
  toDate: joi.date().greater(joi.ref("fromDate")).required(),
  note: joi.string().optional(),
  phone: joi.string().required(),
  propertyId: generalFiled.id.required(),
  paymentMethod: joi.string().valid("cash", "card").required(),
  ln: joi.string().valid('en', 'ar').required().messages({
    'any.required': 'Language is required.',
    'string.base': 'Language must be a string.',
    'any.only': 'Language must be either "en" or "ar".'
  })
}).required();

export const cancelrent = joi.object({
  rentId: generalFiled.id.required(),
  reason: joi.string().optional(),
  ln: joi.string().valid('en', 'ar').required().messages({
    'any.required': 'Language is required.',
    'string.base': 'Language must be a string.',
    'any.only': 'Language must be either "en" or "ar".'
  }),
}).required();


export const sellProperty = joi.object({
  note: joi.string().optional(),
  phone: joi.string().required(),
  propertyId: generalFiled.id.required(),
  paymentMethod: joi.string().valid("cash", "card").required(),
  ln: joi.string().valid('en', 'ar').required().messages({
    'any.required': 'Language is required.',
    'string.base': 'Language must be a string.',
    'any.only': 'Language must be either "en" or "ar".'
  })
}).required();