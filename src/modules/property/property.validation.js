import joi from "joi"
import { generalFiled } from "../../middleware/validation.js"



export const createproperty = joi.object({
    name: joi.string().required(),
    country: generalFiled.id.required(),
    description: joi.string().optional(),
    type: joi.string().valid("Sell", "Rent").required(),
    rentType: joi.string().valid("Daily","Monthly", "Yearly"),//TODO "Monthly", "Yearly"
    price: joi.number().integer().required(),
    discount: joi.number().integer().optional(),
    categoryId: generalFiled.id.required(),
    subcategoryId: generalFiled.id.required(),
    facilities: joi.array().items(joi.string().required()).single().required(),
    features: joi.array().items(joi.string().required()).single().required(),
    file: joi.object({
        mainImage: joi.array().items(generalFiled.file.required()).min(1).max(1).required(),
        subImages: joi.array().items(generalFiled.file.required()).min(1).max(5).required(),
    }).required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    location: joi.string().required().custom((value, helpers) => {
        try {
            const locationObj = JSON.parse(value);
            const schema = joi.object().keys({
                coordinates: joi.array()
                    .items(joi.number().required())
                    .length(2)
                    .required()
            });
            const { error } = schema.validate(
                locationObj
            );
            if (error) {
                return helpers.error(error);
            }
            return true;
        } catch (err) {
            return helpers.error(err);
        }
    }),

}).required()

export const updateproperty = joi.object({
    id: generalFiled.id.required(),
    name: joi.string().optional(),
    country: generalFiled.id,
    description: joi.string().optional(),
    type: joi.string().valid("Sell", "Rent").optional(),
    rentType: joi.string().valid("Daily", "Monthly", "Yearly"),
    price: joi.number().integer().optional(),
    discount: joi.number().integer().optional(),
    categoryId: generalFiled.id.optional(),
    subcategoryId: generalFiled.id.optional(),
    facilities: joi.array().items(joi.string().optional()).single().optional(),
    features: joi.array().items(joi.string().optional()).single().optional(),
    file: joi.object({
        mainImage: joi.array().items(generalFiled.file.optional()).min(1).max(1).optional(),
        subImages: joi.array().items(generalFiled.file.optional()).min(1).max(5).optional(),
    }).optional(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).optional()

export const delteproperty = joi.object({
    id: generalFiled.id.required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()

export const uploadVideo = joi.object({
    id: generalFiled.id.required(),
    file: generalFiled.file.required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()
export const languageAndId = joi.object({
    ln: generalFiled.ln,
    id: generalFiled.id.required(),
}).required()


export const language = joi.object({
    ln: generalFiled.ln
}).required()



