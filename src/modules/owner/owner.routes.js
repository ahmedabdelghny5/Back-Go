import { Router } from "express";
import * as OC from "./owner.controller.js";
import { validation } from "../../middleware/validation.js";
import * as OV from "./owner.validation.js";
import { multerCloudinary } from "../../utils/multerCloud.js";
import { auth, role } from './../../middleware/auth.js';
import reviewRoutes from "../review/review.routes.js"
import { asyncHandler } from "../../utils/globalError.js";



const router = Router();

router.use("/:ownerId/reviews", reviewRoutes)


router.post("/signUp",
    validation(OV.language),
    multerCloudinary().fields([
        { name: "frontId", maxCount: 1 },
        { name: "backId", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    validation(OV.signUp),
    OC.signUp);
router.patch("/confirmEmail", validation(OV.confirmEmail), OC.confirmEmail);
router.patch("/sendCode", validation(OV.sendCode), OC.sendCode);
router.patch("/forgetPassword", validation(OV.forgetPassword), OC.forgetPassword);
router.patch("/resetPassword", validation(OV.resetPassword), OC.resetPassword);
router.patch("/logOut", validation(OV.language), auth(role.Owner), OC.logOut);
router.patch("/changeOldPassword", validation(OV.changeOldPassword), auth(role.Owner), OC.changeOldPassword);
router.post("/signIn", validation(OV.signIn), OC.signIn);
router.get("/", validation(OV.language), OC.getAllowners);
router.get("/property", validation(OV.language), OC.getAllownersWithProperty);
router.get("/review", validation(OV.language), OC.getAllownersWithReviews);
router.get("/top", validation(OV.language), OC.topOwners);
router.get('/allRequest',
    validation(OV.language),
    auth(role.Owner),
    OC.getAllRequest
)
router.get("/property-owner", validation(OV.language), auth(role.Owner), OC.getCertainownersWithProperty);
router.get('/get-transactions',
    validation(OV.language),
    auth(role.Owner),
    asyncHandler(OC.getTransactions))
router.get("/:ownerId", validation(OV.language), OC.getCertainownersWithAcceptedProperties);
router.post("/emailExist", validation(OV.emailExist), OC.emailExist);


router.patch('/request/:id',
    validation(OV.dealWithRequest),
    auth(role.Owner),
    OC.dealWithRequest
)


router.put("/update",
    validation(OV.language),
    auth(role.Owner),
    multerCloudinary().fields([
        { name: "frontId", maxCount: 1 },
        { name: "backId", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    validation(OV.updateOwner),
    OC.updateOwner
);


router.post('/enter-with-google',
    multerCloudinary().fields([
        { name: "frontId", maxCount: 1 },
        { name: "backId", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    validation(OV.enterWithGoogl),
    OC.EnterWithGoogle)



export default router;
