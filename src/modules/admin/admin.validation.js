import { generalFiled } from "../../middleware/validation.js";
import joi from "joi"




export const language = joi.object({
    ln: generalFiled.ln
}).required()


export const signIn = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    email: generalFiled.email,
    password: generalFiled.password,
}).required()

export const addAdmin = joi.object({
    name: joi.string().min(2).max(100).required(),
    email: generalFiled.email,
    password: generalFiled.password,
    rePassword: generalFiled.rePassword,
    phone: joi.string().required(),
    file: generalFiled.file.optional(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
}).required();

export const confirmEmail = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    email: generalFiled.email,
    code: joi.string().min(4).max(4).required(),
}).required()

export const sendCode = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),

    email: generalFiled.email,
}).required()

export const forgetPassword = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),

    email: generalFiled.email,
}).required()

export const resetPassword = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),

    email: generalFiled.email,
    newPassword: generalFiled.password,
    rePassword: joi.string().valid(joi.ref("newPassword")).required(),
    code: joi.string().min(4).max(4).required(),
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

export const updateAdmin = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
    name: joi.string().min(2).max(100).required(),
    phone: joi.string().optional(),
    file: generalFiled.file.optional(),
}).optional()

export const logOut = joi.object({
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    }),
})

export const dealWithRequest = joi.object({
    id: generalFiled.id.required(),
    accepted: joi.boolean().required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
})
export const getproperties = joi.object({
    available: joi.boolean().required(),
    accepted: joi.boolean().required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
})
export const getOwners = joi.object({
    accepted: joi.boolean().required(),
    ln: joi.string().valid('en', 'ar').required().messages({
        'any.required': 'Language is required.',
        'string.base': 'Language must be a string.',
        'any.only': 'Language must be either "en" or "ar".'
    })
})