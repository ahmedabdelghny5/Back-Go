import { Router } from "express";
import * as PC from "./property.controller.js";
import * as PV from "./property.validation.js";
import { validation } from "../../middleware/validation.js";
import { allowedValidation, multerCloudinary } from "../../utils/multerCloud.js";
import { auth, role } from "../../middleware/auth.js";
import reviewRoutes from "../review/review.routes.js"
import { asyncHandler } from "../../utils/globalError.js";
import { noData } from './../../globalValidation.js';
const router = Router();

router.use("/:propertyId/reviews", reviewRoutes)

router.post("/",
    validation(PV.language),
    auth(role.Owner),
    multerCloudinary().fields([
        { name: "mainImage", maxCount: 1 },
        { name: "subImages", maxCount: 5 },
    ]),
    validation(PV.createproperty),
    PC.createproperty);

router.put("/:id",
    validation(PV.languageAndId),
    auth(role.Owner),
    multerCloudinary().fields([
        { name: "mainImage", maxCount: 1 },
        { name: "subImages", maxCount: 5 },
    ]),
    validation(PV.updateproperty),
    PC.updateproperty);

router.delete("/:id",
    validation(PV.languageAndId),
    auth(role.Owner),
    validation(PV.delteproperty),
    PC.deleteproperty);

router.patch("/:id",
    validation(PV.languageAndId),
    auth(role.Owner),
    multerCloudinary(allowedValidation.video).single("video"),
    validation(PV.uploadVideo),
    PC.uploadVideo);

router.get("/",
    validation(PV.language),
    PC.getAllproperty);

router.get("/discount",
    validation(PV.language),
    PC.biggestDiscount);

router.get("/available",
    validation(PV.language),
    PC.getAllpropertyAvailable);

router.get("/notAvailable",
    validation(PV.language),
    auth(role.Owner),
    PC.getAllpropertyNotAvailable);


router.get("/review",
    validation(PV.language),
    PC.getAllpropertyWithReview);

router.get("/nearstProperty",
    validation(PV.language),
    auth(role.User),
    PC.getNearstProperty);
    
router.get("/nearestAndTop",
    validation(PV.language),
    auth(role.User),
    PC.nearestAndTop);

router.get('/top-locations',
    asyncHandler(PC.topLocations))

router.get('/country/:id',
    validation(PV.languageAndId),
    auth(role.User),
    PC.getPropertiesByCountry)

export default router;