import { AppError, asyncHandler } from "../../utils/globalError.js";
import userModel from "../../../DB/models/user.model.js"
import { sendEmail } from "../../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import { nanoid, customAlphabet, customRandom } from "nanoid";
import cloudinary from './../../utils/cloudinary.js';
import propertyModel from "../../../DB/models/property.model.js";
import { allMessages } from "../../utils/localizationHelper.js";
import CryptoJS from "crypto-js";
import { selectOwner, selectProperty } from "../owner/owner.controller.js";


export const selectUser = 'name email phone frontId.secure_url backId.secure_url nationalId image.secure_url country rate numberOfRates location wishList'
//**************************signUp******************* *//
export const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, nationalId, country } = req.body;
  const exist = await userModel.findOne({ email });
  if (exist) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST, 400));
  }
  //location
  let location = JSON.parse(req.body.location)
  const newLocation = {
    type: 'Point',
    coordinates: [location.coordinates[0], location.coordinates[1]]
  }
  req.body.location = newLocation

  const hash = bcrypt.hashSync(password, +process.env.saltOrRounds)
  req.body.password = hash
  let customId = nanoid(4)
  if (req.files.image) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.image[0].path,
      {
        folder: `Back-Go/users/${customId}/image`,
      }
    );
    req.body.image = { secure_url, public_id }
  }
  if (req.files.frontId) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.frontId[0].path,
      {
        folder: `Back-Go/users/${customId}/card`,
      }
    );
    req.body.frontId = { secure_url, public_id }
  }
  if (req.files.backId) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.backId[0].path,
      {
        folder: `Back-Go/users/${customId}/card`,
      }
    );
    req.body.backId = { secure_url, public_id }
  }
  req.body.customId = customId
  const user = await userModel.create(req.body)
  user.confirmed = true
  await user.save()
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS })
});

//*****************************email exist******************* */

export const emailExist = asyncHandler(async (req, res, next) => {
  const { email } = req.body
  const user = await userModel.findOne({ email })
  if (user) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST, 400));
  }
  //email
  const customCode = nanoid(4)
  const sended = await sendEmail(email, "code confirm", `<h1>code:${customCode}</h1>`)
  if (!sended) {
    return next(new AppError(allMessages[req.query.ln].NOT_VALID_ACCOUNT, 400));
  }

  // encrypt code
  const code = await CryptoJS.AES.encrypt(
    JSON.stringify({ code: customCode, createdAt: Date.now() }),
    process.env.ENCRYPTION_KEY
  ).toString();

  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, code })
});
//**************************confirmEmail******************* *//
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, code, codeInfo } = req.body;
  const user = await userModel.findOne({ email })
  if (user) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST, 400));
  }
  //decription
  let bytes = await CryptoJS.AES.decrypt(codeInfo, process.env.ENCRYPTION_KEY);
  let decoded = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  if (Date.now() > decoded.createdAt + 2 * 60000) {
    return next(new AppError(allMessages[req.query.ln].CODE_EXPIRED, 400));
  }
  if (code != decoded.code) {
    return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
  }
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_CONFIRM_EMAIL })

});

//**************************sendCode******************* *//
export const sendCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email })
  if (user) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST, 400));
  }
  //email
  const customCode = customAlphabet('0123456789', 4)
  let codeFun = customCode()
  const sended = await sendEmail(email, "code refresh", `<h1>code:${codeFun}</h1>`)
  if (!sended) {
    return next(new AppError(allMessages[req.query.ln].NOT_VALID_ACCOUNT, 400));
  }
  const code = await CryptoJS.AES.encrypt(
    JSON.stringify({ code: codeFun, createdAt: Date.now() }),
    process.env.ENCRYPTION_KEY
  ).toString();
  res.status(201).json({ message: allMessages[req.query.ln].CHECK_YOUY_INBOX, code })
});

//**************************forgetPassword******************* *//
export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const exist = await userModel.findOne({ email });
  if (!exist) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 400));
  }
  const customCode = customAlphabet('0123456789', 4)
  let codeFun = customCode()
  await sendEmail(email, "resetPassword", `<h1>code:${codeFun}</h1>`)

  await userModel.updateOne({ email }, { codeInfo: { code: codeFun, createdAt: Date.now() } })
  res.status(200).json({ message: allMessages[req.query.ln].CHECK_YOUY_INBOX })
});


//**************************resetPassword******************* *//
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword, code } = req.body

  const user = await userModel.findOne({ email: email })
  if (!user) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  if (!user.codeInfo.createdAt) {
    return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
  }
  if (Date.now() > user.codeInfo.createdAt?.getTime() + 2 * 60000) {
    return next(new AppError(allMessages[req.query.ln].CODE_EXPIRED, 400));
  }
  if (code != user.codeInfo.code) {
    return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
  }
  const customId = nanoid(4)
  const hashePassword = bcrypt.hashSync(newPassword, +process.env.saltOrRounds)
  const newuser = await userModel.updateOne({ email },
    { password: hashePassword, "codeInfo.code": customId, changePassAt: Date.now() })

  res.status(201).json({ message: allMessages[req.query.ln].PASSWORD_SUCCESS })
});

//**************************changeOldPassword******************* *//

export const changeOldPassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.user._id
  let user = await userModel.findById(id);
  const match = bcrypt.compareSync(oldPassword, user.password)
  if (!match) {
    return next(new AppError(allMessages[req.query.ln].FAIL_PASS_MATCHING, 403))
  }
  const same = bcrypt.compareSync(newPassword, user.password)
  if (same) {
    return next(new AppError(allMessages[req.query.ln].PASSWORD_SAME_AS_OLD_PASSWORD, 403))
  }
  const newPassHashed = bcrypt.hashSync(newPassword, +process.env.saltOrRounds)
  await userModel.findByIdAndUpdate(id, { password: newPassHashed }, { new: true })
  res.status(200).json({ message: allMessages[req.query.ln].PASSWORD_SUCCESS })
}

//**************************updateUser******************* *//

export const updateUser = async (req, res, next) => {
  let { name, phone, nationalId } = req.body
  const user = await userModel.findById(req.user._id)
  if (!user) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  if (name) user.name = name
  if (phone) user.phone = phone
  if (nationalId) user.nationalId = nationalId

  //country>>>>>>>>>>>

  if (req.body.location) {
    location = JSON.parse(req.body.location)
    const newLocation = {
      type: 'Point',
      coordinates: [location.coordinates[0], location.coordinates[1]]
    }
    user.location = newLocation
  }
  if (req.files?.image) {
    await cloudinary.uploader.destroy(user.image.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.image[0].path,
      {
        folder: `Back-Go/users/${user.customId}/image`,
      }
    );
    user.image = { secure_url, public_id }
  }
  if (req.files?.frontId) {
    await cloudinary.uploader.destroy(user.frontId.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.frontId[0].path,
      {
        folder: `Back-Go/users/${user.customId}/card`,
      }
    );
    user.frontId = { secure_url, public_id }
  }
  if (req.files?.backId) {
    await cloudinary.uploader.destroy(user.backId.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.backId[0].path,
      {
        folder: `Back-Go/users/${user.customId}/card`,
      }
    );
    user.backId = { secure_url, public_id }
  }

  await user.save()
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED })

}

//**************************signIn******************* *//
export const signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new AppError(allMessages[req.query.ln].NOT_EXIST_LOGiN, 404));
  }
  if (!user.confirmed) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_NOT_CONFIRMED, 400));
  }
  const match = bcrypt.compareSync(password, user.password)
  if (!match) {
    return next(new AppError(allMessages[req.query.ln].NOT_EXIST_LOGiN, 400));
  }
  user.loggedIn = true
  await user.save()
  const token = jwt.sign({ email: user.email, id: user._id, role: "User" }, process.env.signature, { expiresIn: "1year" })
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_LOGIN, token })
});

//**************************logOut******************* *//
export const logOut = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ _id: req.user._id, loggedIn: true });
  if (!user) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  user.loggedIn = false
  await user.save()
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_LOGOUT })
});

// name email phone frontId.secure_url backId.
// secure_url nationalId image.secure_url country rate numberOfRates location wishList

//**************************getAllusers******************* *//
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await userModel.find({}).select(selectUser);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, users })
});

//**************************getUser******************* *//
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id).select(selectUser).populate('wishList');
  if (!user) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, user })
});


// ************************add to wishList****************//
export const addTowishList = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params

  const property = await propertyModel.findById(propertyId)

  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404))
  }
  const user = await userModel.findOneAndUpdate(
    {
      _id: req.user._id,
      wishList: { $nin: propertyId }
    },
    { $addToSet: { wishList: propertyId } },
    { new: true }).select(selectUser).populate([{
      path: 'wishList',
      select: selectProperty,
      populate: [{
        path: 'ownerId',
        select: selectOwner
      }]
    }]);
  if (!user) {
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishList: propertyId } },
      { new: true }
    ).select(selectUser).populate([{
      path: 'wishList',
      select: selectProperty,
      populate: [{
        path: 'ownerId',
        select: selectOwner
      }]
    }]);
    return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, user })
  }
  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, user })
})


// ************************getUserWishList****************//
export const getUserWishList = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id).select("wishList").populate([{
    path: 'wishList',
    select: selectProperty,
    populate: [{
      path: 'ownerId',
      select: selectOwner
    }]
  }]);
  if (!user) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, user })
});


// ************************EnterWithGoogle****************//

export const EnterWithGoogle = async (req, res, next) => {
  const { idToken } = req.body
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.clientId,
  });
  const { email, name, picture } = ticket.getPayload();
  const user = await userModel.findOne({ email })
  if (user && user.provider == 'system') {
    return next(new AppError(allMessages[req.query.ln].SYSTEM_LOGIN))
  }
  if (user && user.provider == 'facebook') {
    return next(new AppError(allMessages[req.query.ln].FACEBOOK_LOGIN))
  }

  if (!user) {
    const { phone, nationalId, location } = req.body;
    const isNationalIdExist = await userModel.findOne({ nationalId })
    if (isNationalIdExist) {
      return next(new AppError(allMessages[req.query.ln].NATIONALID, 400))
    }
    req.body.location = JSON.parse(location)
    if (req.files.image) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.image[0].path,
        {
          folder: `Back-Go/users/${customId}/image`,
        }
      );
      req.body.image = { secure_url, public_id }
    }
    if (req.files.frontId || req.files.frontId.length > 0) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.frontId[0].path,
        {
          folder: `Back-Go/users/${customId}/card`,
        }
      );
      req.body.frontId = { secure_url, public_id }
    } else {

      return next(new AppError(allMessages[req.query.ln].FRONTID, 400))
    }
    if (req.files.backId || req.files.backId.length > 0) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.backId[0].path,
        {
          folder: `Back-Go/users/${customId}/card`,
        }
      );
      req.body.backId = { secure_url, public_id }
    } else {
      return next(new AppError(allMessages[req.query.ln].BACKID, 400))
    }
    req.body.customId = customId
    req.body.confirmed = true
    const owner = await userModel.create(req.body)
    if (!owner) {
      return next(new AppError("fail", 400));
    }
    return res.json({ message: 'done', owner });
  }
  if (user && user.provider == 'google') {
    const token = jwt.sign({ email: owner.email, id: owner._id, role: "User" }, process.env.signature, { expiresIn: "1year" })
    res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, token })
  }

}



