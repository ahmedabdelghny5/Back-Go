import { Router } from "express";
import * as RC from "./rent.controller.js";
import { validation } from "../../middleware/validation.js";
import * as RV from "./rent.Validation.js";
import { auth, role } from "../../middleware/auth.js";
import express from "express";

const router = Router();

router.post(
  "/",
  validation(RV.createrent),
  auth(role.User),
  RC.createrent
);

router.get(
  "/cancelrent/:rentId",
  validation(RV.cancelrent),
  RC.cancelrent
);

router.post(
  "/sell",
  validation(RV.sellProperty),
  auth(role.User),
  RC.sellProperty
);


router.post('/webhook', express.raw({ type: 'application/json' }), RC.webhook);
export default router;
