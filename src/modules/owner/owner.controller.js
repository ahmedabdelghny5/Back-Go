import { AppError, asyncHandler } from "../../utils/globalError.js";
import ownerModel from "../../../DB/models/owner.model.js"
import { sendEmail } from "../../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import { nanoid, customAlphabet } from "nanoid";
import cloudinary from '../../utils/cloudinary.js';
import { OAuth2Client } from 'google-auth-library';
import { allMessages } from "../../utils/localizationHelper.js";
import rentModel from "../../../DB/models/rent.model.js";
import CryptoJS from "crypto-js";
import { selectReview } from "../review/review.controller.js";
import { selectUser } from "../user/user.controller.js";

const client = new OAuth2Client();

export const selectProperty = `_id location name mainImage.secure_url 
 subImages.secure_url categoryId subcategoryId ownerId 
 rate numberOfRates accepted available facilities features 
 country description video.secure_url
 type rentType price discount finalPrice `

export const selectOwner = `name email phone frontId.secure_url
 backId.secure_url nationalId
  image.secure_url country rate numberOfRates location soldItems`
//**************************signUp******************* *//
export const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, nationalId, country } = req.body;
  const exist = await ownerModel.findOne({ email });
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
  const code = nanoid(4)
  await sendEmail(email, "confirm email", `<h1>code:${code}</h1>`)
  req.body.codeInfo = { code, createdAt: Date.now() }

  const hash = bcrypt.hashSync(password, +process.env.saltOrRounds)
  req.body.password = hash
  let customId = nanoid(4)
  if (req.files.image) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.image[0].path,
      {
        folder: `Back-Go/owners/${customId}/image`,
      }
    );
    req.body.image = { secure_url, public_id }
  }
  if (req.files.frontId) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.frontId[0].path,
      {
        folder: `Back-Go/owners/${customId}/card`,
      }
    );
    req.body.frontId = { secure_url, public_id }
  }
  if (req.files.backId) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.backId[0].path,
      {
        folder: `Back-Go/owners/${customId}/card`,
      }
    );
    req.body.backId = { secure_url, public_id }
  }
  req.body.customId = customId
  const owner = await ownerModel.create(req.body)
  owner.confirmed = true
  await owner.save()

  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, owner })
});
//*****************************email exist******************* */

export const emailExist = asyncHandler(async (req, res, next) => {
  const { email } = req.body
  const owner = await ownerModel.findOne({ email })
  if (owner) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_EXIST, 400));
  }
  //email
  const customCode = customAlphabet('0123456789', 4)
  let codeFun = customCode()
  const sended = await sendEmail(email, "code confirm", `<h1>code:${codeFun}</h1>`)
  if (!sended) {
    return next(new AppError(allMessages[req.query.ln].NOT_VALID_ACCOUNT, 400));
  }

  // encrypt code
  const code = await CryptoJS.AES.encrypt(
    JSON.stringify({ code: codeFun, createdAt: Date.now() }),
    process.env.ENCRYPTION_KEY
  ).toString();

  return res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, code })
});

//**************************confirmemail******************* *//
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, code, codeInfo } = req.body;
  const owner = await ownerModel.findOne({ email })
  if (owner) {
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
  const owner = await ownerModel.findOne({ email })
  if (owner) {
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
  const exist = await ownerModel.findOne({ email });
  if (!exist) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 400));
  }
  const customCode = customAlphabet('0123456789', 4)
  let codeFun = customCode()
  await sendEmail(email, "resetPassword", `<h1>code:${codeFun}</h1>`)

  await ownerModel.updateOne({ email }, { codeInfo: { code: codeFun, createdAt: Date.now() } })
  res.status(200).json({ message: allMessages[req.query.ln].CHECK_YOUY_INBOX })
});

//**************************resetPassword******************* *//
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword, rePassword, code } = req.body

  const owner = await ownerModel.findOne({ email: email })
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 400));
  }

  if (Date.now() > owner.codeInfo.createdAt.getTime() + 2 * 60000) {
    return next(new AppError(allMessages[req.query.ln].CODE_EXPIRED, 400));
  }
  if (code != owner.codeInfo.code) {
    return next(new AppError(allMessages[req.query.ln].INVALID_CODE, 400));
  } const customId = nanoid(4)

  const hashePassword = bcrypt.hashSync(newPassword, +process.env.saltOrRounds)
  const newowner = await ownerModel.updateOne({ email },
    { password: hashePassword, "codeInfo.code": customId, changePassAt: Date.now() })

  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS })

});
//**************************changeOldPassword******************* *//

export const changeOldPassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.user._id
  let owner = await ownerModel.findById(id);
  const match = bcrypt.compareSync(oldPassword, owner.password)
  if (!match) {
    return next(new AppError(allMessages[req.query.ln].FAIL_PASS_MATCHING, 403))
  }
  const same = bcrypt.compareSync(newPassword, owner.password)
  if (same) {
    return next(new AppError(allMessages[req.query.ln].PASSWORD_SAME_AS_OLD_PASSWORD, 403))
  }
  const newPassHashed = bcrypt.hashSync(newPassword, +process.env.saltOrRounds)
  await ownerModel.findByIdAndUpdate(id, { password: newPassHashed }, { new: true })
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS })
}
//**************************updateOwner******************* *//

export const updateOwner = async (req, res, next) => {
  let { name, phone, nationalId } = req.body
  const owner = await ownerModel.findById(req.user._id)
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  if (name) owner.name = name
  if (phone) owner.phone = phone
  if (nationalId) owner.nationalId = nationalId

  //country>>>>>>>>>>>

  if (req.body.location) {
    let location = JSON.parse(req.body.location)
    const newLocation = {
      type: 'Point',
      coordinates: [location.coordinates[0], location.coordinates[1]]
    }
    owner.location = newLocation
  }

  if (req.files?.image) {
    await cloudinary.uploader.destroy(owner.image.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.image[0].path,
      {
        folder: `Back-Go/owners/${owner.customId}/image`,
      }
    );
    owner.image = { secure_url, public_id }
  }
  if (req.files?.frontId) {
    await cloudinary.uploader.destroy(owner.frontId.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.frontId[0].path,
      {
        folder: `Back-Go/owners/${owner.customId}/card`,
      }
    );
    owner.frontId = { secure_url, public_id }
  }
  if (req.files?.backId) {
    await cloudinary.uploader.destroy(owner.backId.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.backId[0].path,
      {
        folder: `Back-Go/owners/${owner.customId}/card`,
      }
    );
    owner.backId = { secure_url, public_id }
  }

  await owner.save()
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS })

}
//**************************signIn******************* *//
export const signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const owner = await ownerModel.findOne({ email });
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].NOT_EXIST_LOGiN, 404));
  }
  if (!owner.confirmed) {
    return next(new AppError(allMessages[req.query.ln].EMAIL_NOT_CONFIRMED, 400));
  }
  const match = bcrypt.compareSync(password, owner.password)
  if (!match) {
    return next(new AppError(allMessages[req.query.ln].NOT_EXIST_LOGiN, 403))
  }
  owner.loggedIn = true
  await owner.save()
  const token = jwt.sign({ email: owner.email, id: owner._id, role: "Owner" }, process.env.signature, { expiresIn: "1year" })
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, token })
});
//**************************logOut******************* *//
export const logOut = asyncHandler(async (req, res, next) => {
  const owner = await ownerModel.findOne({ _id: req.user._id, loggedIn: true });
  if (!owner) {
    return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404));
  }
  owner.loggedIn = false
  await owner.save()
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS })
});

//**************************getAllowners******************* *//
export const getAllowners = asyncHandler(async (req, res, next) => {
  const owners = await ownerModel.find({}).select(selectOwner);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owners })
});
//**************************topOwners******************* *//
export const topOwners = asyncHandler(async (req, res, next) => {
  const owners = await ownerModel.find({}).select(selectOwner).sort("-rate -soldItems").limit(20).populate(
    {
      path: "Property",
      select: selectProperty,
      match: { accepted: true }
    }
  );
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owners })
});


//**************************getAllownersWithProperties******************* *//
export const getAllownersWithProperty = asyncHandler(async (req, res, next) => {
  const owners = await ownerModel.find({}).select(selectOwner).populate([
    {
      path: "Property",
      select: selectProperty
    }
  ]);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owners })
});
//**************************getCertainownersWithProperties******************* *//
export const getCertainownersWithProperty = asyncHandler(async (req, res, next) => {

  const owner = await ownerModel.findById(req.user._id).select(selectOwner).populate([
    {
      path: "Review",
      select: selectReview
    },
    {
      path: "Property",
      select: selectProperty,
      populate: [
        {
          path: "Review",
          select: selectReview
        }
      ]
    },
  ]);
  const transactions = await rentModel.find({ 'property.ownerId': req.user._id }).populate([{
    path: 'userId',
    select: selectUser
  }])
  // console.log(Object.keys(owner.subImages));
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owner, transactions })
});
//**************************getCertainownersWithAcceptedProperties******************* *//
export const getCertainownersWithAcceptedProperties = asyncHandler(async (req, res, next) => {

  const owner = await ownerModel.findById(req.params.ownerId).select(selectOwner).populate([
    {
      path: "Property",
      select: selectProperty,
      match: { accepted: true }
    }
  ]);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owner })
});


// **************************getAllownersWithReviews******************* *//
export const getAllownersWithReviews = asyncHandler(async (req, res, next) => {
  const owners = await ownerModel.find({}).select(selectOwner).populate([
    { path: "Review", select: selectReview }
  ])
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, owners })
});

// **************************EnterWithGoogle******************* *//

export const EnterWithGoogle = async (req, res, next) => {
  const { idToken } = req.body
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.clientId,
  });
  const { email, name, picture } = ticket.getPayload();
  const user = await ownerModel.findOne({ email })
  if (user && user.provider == 'system') {
    return next(new AppError(allMessages[req.query.ln].SYSTEM_LOGIN))
  }
  if (user && user.provider == 'facebook') {
    return next(new AppError(allMessages[req.query.ln].FACEBOOK_LOGIN))
  }

  if (!user) {
    const { phone, nationalId, location } = req.body;
    const isNationalIdExist = await ownerModel.findOne({ nationalId })
    if (isNationalIdExist) {
      return next(new AppError(allMessages[req.query.ln].NATIONALID, 400))
    }
    req.body.location = JSON.parse(location)
    if (req.files.image) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.image[0].path,
        {
          folder: `Back-Go/owners/${customId}/image`,
        }
      );
      req.body.image = { secure_url, public_id }
    }
    if (req.files.frontId || req.files.frontId.length > 0) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.frontId[0].path,
        {
          folder: `Back-Go/owners/${customId}/card`,
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
          folder: `Back-Go/owners/${customId}/card`,
        }
      );
      req.body.backId = { secure_url, public_id }
    } else {
      return next(new AppError(allMessages[req.query.ln].BACKID, 400))
    }
    req.body.customId = customId
    req.body.confirmed = true
    const owner = await ownerModel.create(req.body)
    if (!owner) {
      return next(new AppError("fail", 400));
    }
    return res.json({ message: 'done', owner });
  }
  if (user && user.provider == 'google') {
    const token = jwt.sign({ email: owner.email, id: owner._id, role: "Owner" }, process.env.signature, { expiresIn: "1year" })
    res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, token })
  }
}

// **************************getTransactions******************* *//
export const getTransactions = async (req, res, next) => {
  // const user = req.user
  const transactions = await rentModel.find({ 'property.ownerId': req.user._id, accepted: true }).populate([{
    path: 'userId',
    select: selectUser
  }])
  res.json({ message: allMessages[req.query.ln].SUCCESS, transactions })
}


// **************************dealWithRequest******************* *//
export const dealWithRequest = async (req, res, next) => {
  const { id } = req.params;
  const { accepted } = req.query;
  const rent = await rentModel.findOneAndUpdate({ _id: id, accepted: false }, { accepted }, { new: true });
  if (!rent) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (rent.property.ownerId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  return res.json({ message: allMessages[req.query.ln].SUCCESS })
}
// **************************getAllRequest******************* *//
export const getAllRequest = async (req, res, next) => {
  const rent = await rentModel.find({
    accepted: false, "property.ownerId": req.user._id
  }).select("userId property totalPrice phone paymentMethod status fromDate toDate note reason");
  return res.json({ message: allMessages[req.query.ln].SUCCESS, rent })
}


