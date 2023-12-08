import categoryModel from "../../../DB/models/category.model.js";
import subCategoryModel from "../../../DB/models/subCategory.model.js";
import { AppError, asyncHandler } from "../../utils/globalError.js";
import cloudinary from "./../../utils/cloudinary.js";
import { nanoid } from "nanoid";
import slugify from "slugify";
import { allMessages } from "../../utils/localizationHelper.js";
import propertyModel from "../../../DB/models/property.model.js";
import { selectOwner, selectProperty } from "../owner/owner.controller.js";


export const selectCategory = "_id nameAR nameEN  image.secure_url facilities"

// *******************************createCategory*********************************//
export const createCategory = asyncHandler(async (req, res, next) => {
  const { nameAR, nameEN, facilities } = req.body;
  const exist = await categoryModel.findOne({ $or: [{ nameAR }, { nameEN }] });
  if (exist) {
    return next(new AppError(allMessages[req.query.ln].Category_exist, 401));
  }

  if (req.file) {
    const customId = nanoid(4);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Back-Go/categories/${customId}`,
      }
    );
    req.body.customId = customId
    req.body.image = { secure_url, public_id }
  }
  req.body.nameAR = nameAR.toLowerCase()
  req.body.nameEN = nameEN.toLowerCase()

  req.body.createdBy = req.user._id
  // req.body.facilities = facilities
  const category = await categoryModel.create(req.body);
  if (!category) {
    await cloudinary.uploader.destroy(category.image.public_id);
    return next(new AppError(allMessages[req.query.ln].FAIL_CREATED, 500));
  }
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_ADDEDCategory });
});

// *******************************updateCategory*********************************//

export const updateCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const { nameAR, nameEN } = req.body;
  const category = await categoryModel.findById(categoryId);
  //propert exist
  if (!category) {
    return next(new AppError(allMessages[req.query.ln].Category_NOT_FOUND, 404));
  }
  if (category.createdBy.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  if (nameAR) {
    if (category.nameAR == nameAR.toLowerCase()) {
      return next(new AppError(allMessages[req.query.ln].GENERAL_EXISTENCE, 401));
    }
    if (await categoryModel.findOne({ nameAR: nameAR.toLowerCase() })) {
      return next(new AppError(allMessages[req.query.ln].MATCHING_OLD, 401));
    }
    category.nameAR = nameAR.toLowerCase();
  }
  if (nameEN) {
    if (category.nameEN == nameEN.toLowerCase()) {
      return next(new AppError(allMessages[req.query.ln].GENERAL_EXISTENCE, 401));
    }
    if (await categoryModel.findOne({ nameEN: nameEN.toLowerCase() })) {
      return next(new AppError(allMessages[req.query.ln].MATCHING_OLD, 401));
    }
    category.nameEN = nameEN.toLowerCase();
  }
  if (req.file) {
    await cloudinary.uploader.destroy(category.image.public_id);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Back-Go/categories/${category.customId}`,
      }
    );
    category.image = { secure_url, public_id };
  }
  if (req.body.facilities) {
    category.facilities = req.body.facilities
  }
  await category.save();
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED });
});

// ************************************getCategories*************************************

export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await categoryModel.find().select(selectCategory).populate([{
    path: "properties",
    select: selectProperty,
    match: { accepted: true },
    populate: [{
      path: 'ownerId',
      select: selectOwner
    }]
  }]);
  const properties = await propertyModel.find({ accepted: true }).select(selectProperty).populate([{
    path: 'ownerId',
    select: selectOwner
  }])

  categories.unshift({
    _id: "6519f8b5798427db4349716e",
    nameEN: "All",
    nameAR: "الجميع",
    facilities: [],
    image: {
      secure_url: "https://res.cloudinary.com/dydg8pkus/image/upload/v1696200884/Back-Go/categories/8nNN/dtbbbckqtey9aineyglg.jpg",
      public_id: "Back-Go/categories/8nNN/dtbbbckqtey9aineyglg"
    },
    properties,
    id: "6519f8b5798427db4349716e"

  })

  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, categories });
});
// ************************************getCategory*************************************

export const getCategory = asyncHandler(async (req, res, next) => {
  const categories = await categoryModel.find().select(selectCategory)
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, categories });
});

// ************************************deleteCategories*************************************

export const deleteCategories = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await categoryModel.findById(categoryId);
  //propert exist
  if (!category) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (category.createdBy.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  await categoryModel.findByIdAndDelete(categoryId);
  // delete from cloudinary
  await cloudinary.api.delete_resources_by_prefix(
    `Back-Go/categories/${category.customId}`
  );
  await cloudinary.api.delete_folder(
    `Back-Go/categories/${category.customId}`
  );

  // deleteSubCategories from db
  await subCategoryModel.deleteMany({ categoryId });

  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS });
});


