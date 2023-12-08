import { Router } from "express";
import * as SCC from "./subCategory.controller.js";
import { validation } from "../../middleware/validation.js";
import * as SCV from "./subCategory.Validation.js";
import { multerCloudinary } from "../../utils/multerCloud.js";
import { auth, role } from "../../middleware/auth.js";
const router = Router({ mergeParams: true });

router.get("/", validation(SCV.language), SCC.getSubCategories);

router.post(
  "/",
  validation(SCV.languageAndCatId),
  auth([...role.Admin,...role.superAdmin]),
  multerCloudinary().single("image"),
  validation(SCV.createSubCategory),
  SCC.createSubCategory
);

router.put(
  "/:subCategoryId",
  validation(SCV.languageAndIds),
  auth([...role.Admin,...role.superAdmin]),
  multerCloudinary().single("image"),
  validation(SCV.updateSubCategory),
  SCC.updateSubCategory
);

router.delete("/:subCategoryId",
  validation(SCV.languageAndSubId),
  auth([...role.Admin,...role.superAdmin]),
  validation(SCV.deleteSubCategory),
  SCC.deleteSubCategory);


export default router;
