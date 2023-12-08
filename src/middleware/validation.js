import joi from "joi";
import { AppError } from "../utils/globalError.js";
import { Types } from "mongoose";


const validationId = (value, helper) => {
  return Types.ObjectId.isValid(value) ? true : helper.message("invalid id")
}

export const generalFiled = {
  email: joi.string().email({ tlds: { allow: ['com', 'net', 'org'] } }).required(),
  password: joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).messages({
    'string.pattern.base': 'Email or Password are Incorrect',
  }).required(),
  rePassword: joi.string().valid(joi.ref("password")).required(),
  id: joi.string().custom(validationId),
  file: joi.object({
    size: joi.number().positive().required(),
    path: joi.string().required(),
    filename: joi.string().required(),
    destination: joi.string().required(),
    mimetype: joi.string().required(),
    encoding: joi.string().required(),
    originalname: joi.string().required(),
    fieldname: joi.string().required(),
  }),
  ln: joi.string().valid('en', 'ar').required().messages({
    'any.required': 'Language is required.',
    'string.base': 'Language must be a string.',
    'any.only': 'Language must be either "en" or "ar".'
  })
};


export const validation = (schema) => {

  return (req, res, next) => {

    const inputData = { ...req.body, ...req.query, ...req.params }
    if (req.file || req.files) {
      inputData.file = req.file || req.files
    }
    let arrErr = [];
    const { error } = schema.validate(inputData, { abortEarly: true });
    if (error) {
      error.details.map((err) => {
        arrErr.push(err.message);
      });
    }
    if (arrErr.length) {
      return next(new AppError(arrErr[0], 400));
    }
    next();
  };
};



