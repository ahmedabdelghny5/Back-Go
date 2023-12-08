
import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { noData } from "../../globalValidation.js";
import * as DC from "./dashboard.controller.js";

const router = Router();

router.get('/',validation(noData), DC.dashboard)


export default router