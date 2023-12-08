import jwt from 'jsonwebtoken'
import { AppError } from '../utils/globalError.js';
import { asyncHandler } from '../utils/globalError.js';
import userModel from '../../DB/models/user.model.js';
import ownerModel from './../../DB/models/owner.model.js';
import { allMessages } from '../utils/localizationHelper.js';
import adminModel from '../../DB/models/admin.model.js';

export const role = {
  superAdmin: ["superAdmin"],
  Admin: ["Admin"],
  Owner: ["Owner"],
  User: ["User"]
}

export const auth = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
      return next(new AppError(allMessages[req.query.ln].TOKEN_NOT_EXIST, 404))
    }
    if (!token.startsWith(process.env.secretKey)) {
      return next(new AppError(allMessages[req.query.ln].BEARER_KEY, 400))
    }
    const mainToken = token.split(process.env.secretKey)[1];
    const decoded = jwt.verify(mainToken, process.env.signature)
    if (!decoded?.id) {
      return next(new AppError(allMessages[req.query.ln].INVALID_PAYLOAD, 400))
    }
   
    if (!accessRoles.includes(decoded.role)) {
      return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401))
    }
    let user;
    if (decoded.role == "User") {
      user = await userModel.findById(decoded.id).select("-password")
    }
    if (decoded.role == "Owner") {
      user = await ownerModel.findById(decoded.id).select("-password")
    }
    if (decoded.role == "superAdmin") {
      user = await adminModel.findById(decoded.id).select("-password")
    }
    if (decoded.role == "Admin") {
      user = await adminModel.findById(decoded.id).select("-password")
    }
    if (!user) {
      return next(new AppError(allMessages[req.query.ln].USER_NOT_EXIST, 404))
    }
    if (!user.confirmed) {
      return next(new AppError(allMessages[req.query.ln].EMAIL_NOT_CONFIRMED, 400));
    }
    if (!user.loggedIn) {
      return next(new AppError(allMessages[req.query.ln].LOGIN_FIRST, 400))
    }
    if (parseInt(user?.changePassAt?.getTime() / 1000) > decoded.iat) {
      return next(new AppError(allMessages[req.query.ln].PASSWORD_CHANGED))
    }
    req.user = user
    next()
  })

}
