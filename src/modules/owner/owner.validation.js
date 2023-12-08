import joi from "joi"
import { generalFiled } from "../../middleware/validation.js"


export const signUp = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    name: joi.string().min(2).max(100).required(),
    email: generalFiled.email,
    password: generalFiled.password,
    rePassword: generalFiled.rePassword,
    file: joi.object({
        image: joi.array().items(generalFiled.file.required()).max(1).required(),
        frontId: joi.array().items(generalFiled.file.required()).max(1).required(),
        backId: joi.array().items(generalFiled.file.required()).max(1).required(),
    }),
    nationalId: joi.string().min(14).max(14).required(),
    country: joi.string().required(),
    phone: joi.string().required(),
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

export const confirmEmail = joi.object({
    email: generalFiled.email,
    code: joi.string().min(4).max(4).required(),
    codeInfo: joi.string().required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()

export const sendCode = joi.object({
    email: generalFiled.email,
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()

export const forgetPassword = joi.object({
    email: generalFiled.email,
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()

export const resetPassword = joi.object({
    email: generalFiled.email,
    newPassword: generalFiled.password,
    rePassword: joi.string().valid(joi.ref("newPassword")).required(),
    code: joi.string().min(4).max(4).required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()


export const signIn = joi.object({
    email: generalFiled.email,
    password: generalFiled.password,
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required()


export const enterWithGoogl = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    name: joi.string().min(2).max(100).required(),
    file: joi.object({
        image: joi.array().items(generalFiled.file.required()).max(1).required(),
        frontId: joi.array().items(generalFiled.file.required()).max(1).required(),
        backId: joi.array().items(generalFiled.file.required()).max(1).required(),
    }),
    nationalId: joi.string().min(14).max(14).required(),
    country: joi.string().required(),
    phone: joi.string().required(),
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

export const changeOldPassword = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    oldPassword: joi.string().required(),
    newPassword: generalFiled.password,
}).required()

export const updateOwner = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),

    name: joi.string().min(2).max(100).optional(),
    file: joi.object({
        image: joi.array().items(generalFiled.file.optional()).max(1).optional(),
        frontId: joi.array().items(generalFiled.file.optional()).max(1).optional(),
        backId: joi.array().items(generalFiled.file.optional()).max(1).optional(),
    }),
    nationalId: joi.string().min(14).max(14).optional(),
    country: joi.string().optional(),
    phone: joi.string().optional(),
    location: joi.string().optional().custom((value, helpers) => {
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

}).optional()

export const logOut = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
})

export const languageAndId = joi.object({
    ln: generalFiled.ln,
    id: generalFiled.id.required(),
}).required()


export const language = joi.object({
    ln: generalFiled.ln
}).required()

export const emailExist = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    email: generalFiled.email,
}).required()

export const dealWithRequest = joi.object({
    id: generalFiled.id.required(),
    accepted: joi.boolean().required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
})