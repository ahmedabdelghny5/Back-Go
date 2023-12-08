import { Router } from "express";
import * as UC from "./user.controller.js";
import { validation } from "../../middleware/validation.js";
import * as UV from "./user.validation.js";
import { multerCloudinary } from "../../utils/multerCloud.js";
import { auth, role } from "../../middleware/auth.js";
import { noData } from "../../globalValidation.js";
import { asyncHandler } from "../../utils/globalError.js";




const router = Router();

router.post("/signUp",
    validation(noData),
    multerCloudinary().fields([
        { name: "frontId", maxCount: 1 },
        { name: "backId", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    validation(UV.signUp),
    UC.signUp
);

router.patch("/confirmEmail", validation(UV.confirmEmail), UC.confirmEmail);
router.patch("/sendCode", validation(UV.sendCode), UC.sendCode);
router.patch("/forgetPassword", validation(UV.forgetPassword), UC.forgetPassword);
router.patch("/resetPassword", validation(UV.resetPassword), UC.resetPassword);
router.patch("/logOut", auth(role.User), UC.logOut);
router.patch("/changeOldPassword", validation(UV.changeOldPassword), auth(role.User), UC.changeOldPassword);
router.post("/signIn", validation(UV.signIn), UC.signIn);
router.get("/", validation(noData), UC.getAllUsers);
router.get("/profile", validation(noData), auth(role.User), UC.getUser);
router.get("/WishList", validation(noData), auth(role.User), UC.getUserWishList);
router.post("/emailExist", validation(UV.emailExist), UC.emailExist);

router.patch("/WishList/:propertyId",

    validation(UV.addTowishList),
    auth(role.User),
    UC.addTowishList
)
router.put("/update",
    validation(noData),
    auth(role.User),
    multerCloudinary().fields([
        { name: "frontId", maxCount: 1 },
        { name: "backId", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    validation(UV.updateUser),
    UC.updateUser
);
router.post('/enter-with-google', multerCloudinary().fields([
    { name: "frontId", maxCount: 1 },
    { name: "backId", maxCount: 1 },
    { name: "image", maxCount: 1 },
]), validation(UV.enterWithGoogl), asyncHandler(UC.EnterWithGoogle))


export default router;
