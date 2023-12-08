import multer from "multer"
import { AppError } from "./globalError.js"
import { allMessages } from "./localizationHelper.js"


export const allowedValidation = {
    image:  /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP|jif)$/,
    video:  /\.(mp4|avi|flv|wmv|mov|mpeg|3gp|jif)$/,
    pdf: ["application/pdf"],
}


export const multerCloudinary = (customValidation) => {
    if (!customValidation) {
        customValidation = allowedValidation.image
    }
    const storage = multer.diskStorage({})

    // const fileFilter = (req, file, cb) => {
    //     if (customValidation.includes(file.mimetype)) {
    //         cb(null, true)
    //     } else {
    //         cb(new AppError("invalid file", 400), false)
    //     }
    // }
    const fileFilter = (req, file, cb) => {
        if (!file.originalname.match(customValidation)) {
            cb(new AppError(allMessages[req.query.ln].FILE_VALIDATION_ERROR), false)
        } else {
            cb(null, true)
        }
    }


    const upload = multer({ fileFilter, storage })
    return upload
}