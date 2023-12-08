import { nanoid } from "nanoid";
import adminModel from "../../../DB/models/admin.model.js";
import { AppError, asyncHandler } from "../../utils/globalError.js";
import { allMessages } from "../../utils/localizationHelper.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import cloudinary from './../../utils/cloudinary.js';
import { sendEmail } from "../../utils/sendEmail.js";
import ownerModel from "../../../DB/models/owner.model.js";
import propertyModel from './../../../DB/models/property.model.js';
import ApiFeatures from "../../utils/apiFeatures.js";
import CryptoJS from "crypto-js";
import { selectOwner, selectProperty } from "../owner/owner.controller.js";


//**************************signIn******************* *//

export const signIn = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const isExist = await adminModel.findOne({ email });
    if (!isExist) {
        return next(new AppError(allMessages[req.query.ln].NOT_EXIST_LOGiN, 400));
    }
    if (!isExist.confirmed) {
        return next(new AppError(allMessages[req.query.ln].EMAIL_NOT_CONFIRMED, 403));
    }
    const pass = bcrypt.compareSync(password, isExist.password)
    if (!pass) {
        return next(new AppError(allMessages[req.query.ln].NOT_EXIST_LOGiN, 403));
    }
    await adminModel.updateOne({ _id: isExist._id }, { loggedIn: true })
    // token 
    const token = jwt.sign({
        email: isExist.email,
        id: isExist._id,
        role: isExist.role,
        name: isExist.name
    }, process.env.signature, { expiresIn: "1year" })

    res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_LOGIN, token })
})

//**************************addAdmin******************* *//

export const addAdmin = asyncHandler(async (req, res, next) => {
    let { name, phone, email, password, rePassword } = req.body
    //*check if email exists
    const isExist = await adminModel.findOne({ email })
    if (isExist && isExist.confirmed) {
        return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST, 400))
    }
    if (isExist && !isExist.confirmed) {
        return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST_NOT_CONFIRMED, 400))
    }

    //* hash password and encrypt phone
    const hash = bcrypt.hashSync(password, +process.env.saltOrRounds)
    req.body.password = hash

    //email
    const code = nanoid(4)
    const sended = await sendEmail(email, "confirm email", `<h1>code:${code}</h1>`)
    req.body.codeInfo = { code, createdAt: Date.now() }

    if (!sended) {
        return next(new AppError(allMessages[req.query.ln].FAIL_SEND_EMAIL, 403));
    }

    //image
    if (req.file) {
        const customId = nanoid(4);
        const { secure_url, public_id } = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: `Back-Go/admins/${customId}`,
            }
        );
        req.body.customId = customId
        req.body.image = { secure_url, public_id }
    }

    const admin = await adminModel.create(req.body)
    res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_AddAdmin })

})


//**************************confirmEmail******************* *//
export const confirmEmail = asyncHandler(async (req, res, next) => {
    const { email, code } = req.body;
    const admin = await adminModel.findOne({ email })
    if (!admin) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
    }
    if (admin.confirmed) {
        return next(new AppError(allMessages[req.query.ln].EMAIL_ALREADY_CONFIRMED, 400));
    }
    if (admin.codeInfo.code != code) {
        return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
    }
    if (Date.now() > admin.codeInfo.createdAt.getTime() + 2 * 60000) {
        return next(new AppError(allMessages[req.query.ln].CODE_EXPIRED, 400));
    }
    await adminModel.updateOne({ email }, { confirmed: true })

    res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_CONFIRM_EMAIL })

});


//**************************sendCode******************* *//
export const sendCode = asyncHandler(async (req, res, next) => {
    const { email } = req.body
    const admin = await adminModel.findOne({ email })
    if (!admin) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
    }
    if (admin.confirmed) {
        return next(new AppError(allMessages[req.query.ln].EMAIL_ALREADY_CONFIRMED, 400));
    }

    if (Date.now() < admin.codeInfo.createdAt.getTime() + 2 * 60000) {
        return next(new AppError(allMessages[req.query.ln].NOT_EXPIRED, 400))
    }

    const code = nanoid.nanoid(4)
    await sendEmail(email, "Refresh Code", `<h1>Code:${code}</h1>`)
    let codeInfo = { code, createdAt: Date.now() }

    await adminModel.updateOne({ email }, { codeInfo })
    res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_SIGNUP })

});


//**************************forgetPassword******************* *//
export const forgetPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const exist = await adminModel.findOne({ email });
    if (!exist) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 400));
    }
    const code = nanoid(4)
    await sendEmail(email, "resetPassword", `<h1>code:${code}</h1>`)

    await adminModel.updateOne({ email }, { codeInfo: { code, createdAt: Date.now() } })
    res.status(200).json({ message: allMessages[req.query.ln].CHECK_YOUY_INBOX })
});


//**************************resetPassword******************* *//
export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, newPassword, code } = req.body

    const admin = await adminModel.findOne({ email: email })
    if (!admin) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
    }

    if (!admin.codeInfo.createdAt) {
        return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
    }
    if (Date.now() > admin.codeInfo.createdAt?.getTime() + 2 * 60000) {
        return next(new AppError(allMessages[req.query.ln].CODE_EXPIRED, 400));
    }
    if (code != admin.codeInfo.code) {
        return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
    }
    const customId = nanoid(4)
    const hashePassword = bcrypt.hashSync(newPassword, +process.env.saltOrRounds)
    const newadmin = await userModel.updateOne({ email },
        { password: hashePassword, "codeInfo.code": customId, changePassAt: Date.now() })

    res.status(201).json({ message: allMessages[req.query.ln].PASSWORD_SUCCESS })
});



//**************************changeOldPassword******************* *//

export const changeOldPassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const id = req.user._id
    let admin = await adminModel.findById(id);
    const match = bcrypt.compareSync(oldPassword, admin.password)
    if (!match) {
        return next(new AppError(allMessages[req.query.ln].FAIL_PASS_MATCHING, 403))
    }
    const same = bcrypt.compareSync(newPassword, admin.password)
    if (same) {
        return next(new AppError(allMessages[req.query.ln].PASSWORD_SAME_AS_OLD_PASSWORD, 403))
    }
    const newPassHashed = bcrypt.hashSync(newPassword, +process.env.saltOrRounds)
    await adminModel.findByIdAndUpdate(id, { password: newPassHashed }, { new: true })
    res.status(200).json({ message: allMessages[req.query.ln].PASSWORD_SUCCESS })
}

//**************************updateAdmin******************* *//

export const updateAdmin = async (req, res, next) => {
    let { name, phone } = req.body
    const admin = await adminModel.findById(req.admin._id)
    if (!admin) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
    }

    if (name) admin.name = name
    if (phone) admin.phone = phone

    //image
    if (req.file) {
        await cloudinary.uploader.destroy(admin.image.public_id)
        const { secure_url, public_id } = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: `Back-Go/admins/${admin.customId}/image`,
            }
        );
        admin.image = { secure_url, public_id }
    }

    await admin.save()
    res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED })

}

//**************************logOut******************* *//
export const logOut = asyncHandler(async (req, res, next) => {
    const admin = await adminModel.findOne({ _id: req.user._id, loggedIn: true });
    if (!admin) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
    }
    admin.loggedIn = false
    await admin.save()
    res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_LOGOUT })
});


//**************************dealWithOwnerRequest******************* *//

export const dealWithOwnerRequest = async (req, res, next) => {
    const { id } = req.params;
    const { accepted } = req.query;
    const owner = await ownerModel.findOneAndUpdate({ _id: id, accepted: false }, { accepted }, { new: true });
    if (!owner) {
        return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404))
    }
    return res.json({ message: allMessages[req.query.ln].SUCCESS })
}

//**************************dealWithPropertyRequest******************* *//

export const dealWithPropertyRequest = async (req, res, next) => {
    const { id } = req.params;
    const { accepted } = req.query;
    const property = await propertyModel.findOneAndUpdate({ _id: id, accepted: false }, { accepted }, { new: true });
    if (!property) {
        return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
    }
    return res.json({ message: allMessages[req.query.ln].SUCCESS })
}

//**************************getproperties******************* *//

export const getproperties = async (req, res, next) => {

    const apiFeatures = new ApiFeatures(propertyModel.find(req.query).select(selectProperty), req.query)
        .pagination()
        .sort()
        .search()
        .filter()
        .select()
    const properties = await apiFeatures.mongooseQuery
    res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
}
//**************************getOwners******************* *//

export const getOwners = async (req, res, next) => {

    const apiFeatures = new ApiFeatures(ownerModel.find(req.query).select(selectOwner), req.query)
        .pagination()
        .sort()
        .search()
        .filter()
        .select()
    const owners = await apiFeatures.mongooseQuery
    res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owners })
}