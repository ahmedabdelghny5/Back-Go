import { Router } from "express";
import * as CC from "./category.controller.js";
import * as CV from "./category.Validate.js";
import supCategoryRoutes from "../subCategory/subCategory.routes.js";
import { multerCloudinary } from "../../utils/multerCloud.js";
import { validation } from "../../middleware/validation.js";
import { auth, role } from "../../middleware/auth.js";

const router = Router();

router.use("/:categoryId/subCategories", supCategoryRoutes);

router.get("/", validation(CV.language), auth([...role.User, ...role.Admin]), CC.getCategories);
router.get("/some", validation(CV.language), auth(role.Owner), CC.getCategory);

router.delete("/:categoryId",
  validation(CV.languageAndId),
  auth(role.Admin),
  validation(CV.deleteCategory),
  CC.deleteCategories);

router.post(
  "/",
  validation(CV.language),
  auth(role.Admin),
  multerCloudinary().single("image"),
  validation(CV.createCategory),
  CC.createCategory
);
router.put(
  "/:categoryId",
  validation(CV.languageAndId),
  auth(role.Admin),
  multerCloudinary().single("image"),
  validation(CV.updateCategory),
  CC.updateCategory
);

export default router;
