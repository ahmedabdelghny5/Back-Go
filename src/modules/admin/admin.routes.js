import { Router } from "express";
import * as AC from "./admin.controller.js";
import { validation } from "../../middleware/validation.js";
import * as AV from "./admin.validation.js";
import { multerCloudinary } from "../../utils/multerCloud.js";
import { auth, role } from "../../middleware/auth.js";
import { noData } from "../../globalValidation.js";





const router = Router();

router.post("/signIn", validation(AV.signIn), AC.signIn);

router.post("/addAdmin",
    validation(AV.language),
    auth(role.superAdmin),
    multerCloudinary().single("image"),
    validation(AV.addAdmin),
    AC.addAdmin);

router.patch("/confirmEmail", validation(AV.confirmEmail), AC.confirmEmail);
router.patch("/sendCode", validation(AV.sendCode), AC.sendCode);
router.patch("/forgetPassword", validation(AV.forgetPassword), AC.forgetPassword);
router.patch("/resetPassword", validation(AV.resetPassword), AC.resetPassword);
router.patch("/logOut", validation(AV.logOut), auth(role.Owner), AC.logOut);

router.patch("/changeOldPassword",
    validation(AV.changeOldPassword),
    auth(role.Owner),
    AC.changeOldPassword);

router.put("/update",
    validation(AV.language),
    auth(role.Owner),
    multerCloudinary().single("image"),
    validation(AV.updateAdmin),
    AC.updateAdmin
);

router.post('/ownerRequest/:id',
    validation(AV.dealWithRequest),
    auth(role.Admin),
    AC.dealWithOwnerRequest
)

router.post('/propertyRequest/:id',
    validation(AV.dealWithRequest),
    auth(role.Admin),
    AC.dealWithPropertyRequest
)

router.get('/getproperties',
    validation(AV.getproperties),
    auth([...role.Admin, ...role.superAdmin]),
    AC.getproperties
)

router.get('/getOwners',
    validation(AV.getOwners),
    auth(role.Admin),
    AC.getOwners
)





export default router;
