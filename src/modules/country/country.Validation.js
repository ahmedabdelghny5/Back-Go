import joi from "joi";
import { generalFiled } from "../../middleware/validation.js";

export const addCountryVal = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    name: joi.string().required(),
    file: joi.object({
        image: joi.array().items(generalFiled.file.required()).min(1).max(1).required(),
        subImages: joi.array().items(generalFiled.file.required()).min(1).max(3).required(),
    }).required(),
}).required()
