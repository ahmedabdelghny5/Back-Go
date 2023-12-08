import Joi from "joi";



export const noData = Joi.object({
    ln: Joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
      }),  
}).required()