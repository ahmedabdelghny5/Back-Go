import { Router } from "express";
import * as CC from "./country.controller.js";
import { validation } from "../../middleware/validation.js";
import * as CV from "./country.Validation.js";
import { auth, role } from "../../middleware/auth.js";
import express from "express";
import { allowedValidation, multerCloudinary } from "../../utils/multerCloud.js";
import { asyncHandler } from "../../utils/globalError.js";
import { noData } from './../../globalValidation.js';

const router = Router();


router.route('/')
    .post(
        validation(noData),
        multerCloudinary(allowedValidation.image).fields([
            { name: "image", maxCount: 1 },
            { name: "subImages", maxCount: 3 },
        ]),
        validation(CV.addCountryVal),
        auth([...role.Admin,...role.superAdmin]),//!to be enabled when adding Admin Auth
        asyncHandler(CC.addCountry)
    )
    .get(
        validation(noData),
        auth([...role.Admin, ...role.User, ...role.Owner]),//!to be enabled when adding Admin Auth
        asyncHandler(CC.getCountries)
    )

export default router;
