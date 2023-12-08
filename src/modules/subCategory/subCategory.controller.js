import { AppError, asyncHandler } from "../../utils/globalError.js"
import cloudinary from "../../utils/cloudinary.js";
import { nanoid } from "nanoid";
import slugify from "slugify";
import subCategoryModel from "../../../DB/models/subCategory.model.js";
import categoryModel from './../../../DB/models/category.model.js';
import { allMessages } from "../../utils/localizationHelper.js";

export const selectSubCategory = "_id nameAR nameEN  image.secure_url facilities"
// *******************************createSubCategory*********************************//

export const createSubCategory = asyncHandler(async (req, res, next) => {
  const { nameAR, nameEN } = req.body;
  const { categoryId } = req.params;
  const category = await categoryModel.findById(categoryId);
  //propert exist
  if (!category) {
    return next(new AppError(allMessages[req.query.ln].Category_NOT_FOUND, 404));
  }
  const exist = await subCategoryModel.findOne({ $or: [{ nameAR }, { nameEN }] });
  if (exist) {
    return next(new AppError(allMessages[req.query.ln].Category_exist, 401));
  }
  if (req.file) {
    const customId = nanoid(4);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Back-Go/categories/${category.customId}/subCategories/${customId}`,
      }
    );
    req.body.customId = customId
    req.body.image = { secure_url, public_id }
  }
  req.body.nameEN = nameEN
  req.body.nameAR = nameAR

  req.body.categoryId = categoryId
  req.body.createdBy = req.user._id
  const subCategory = await subCategoryModel.create(req.body);
  if (!subCategory) {
    await cloudinary.uploader.destroy(subCategory.image.public_id);
    return next(new AppError(allMessages[req.query.ln].FAIL, 500));
  }
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS });
});

// *******************************updateSubCategory*********************************

export const updateSubCategory = asyncHandler(async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  const { nameAR, nameEN } = req.body;
  const subCategory = await subCategoryModel.findById(subCategoryId);
  //propert exist
  if (!subCategory) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (subCategory.createdBy.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new AppError(allMessages[req.query.ln].Category_NOT_FOUND, 404));
  }
  if (nameEN) {
    if (subCategory.nameEN == nameEN.toLowerCase()) {
      return next(new AppError(allMessages[req.query.ln].GENERAL_EXISTENCE, 401));
    }
    if (await subCategoryModel.findOne({ nameEN: nameEN.toLowerCase() })) {
      return next(new AppError(allMessages[req.query.ln].MATCHING_OLD, 401));
    }
    subCategory.nameEN = nameEN.toLowerCase();
    subCategory.slug = slugify(nameEN);
  }
  if (nameAR) {
    if (subCategory.nameAR == nameAR.toLowerCase()) {
      return next(new AppError(allMessages[req.query.ln].GENERAL_EXISTENCE, 401));
    }
    if (await subCategoryModel.findOne({ nameAR: nameAR.toLowerCase() })) {
      return next(new AppError(allMessages[req.query.ln].MATCHING_OLD, 401));
    }
    subCategory.nameAR = nameAR.toLowerCase();
    subCategory.slug = slugify(nameAR);
  }
  if (req.file) {
    await cloudinary.uploader.destroy(subCategory.image.public_id);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Back-Go/categories/${category.customId}/subCategories/${subCategory.customId}`,
      }
    );
    subCategory.image = { secure_url, public_id };
  }
  await subCategory.save();
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED });
});

// ************************************getSubCategories*************************************

export const getSubCategories = asyncHandler(async (req, res, next) => {
  const subCategories = await subCategoryModel.find().select(selectSubCategory);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, subCategories })

});


// ************************************deleteSubCategory*************************************

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const subCategory = await subCategoryModel.findById(subCategoryId);
  //propert exist
  if (!subCategory) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (subCategory.createdBy.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  await subCategoryModel.findByIdAndDelete(subCategoryId);
  await cloudinary.uploader.destroy(subCategory.image.public_id);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_DELETED });
});