import { Schema, model, Types } from "mongoose";

const subCategorySchema = new Schema(
  {
    nameEN: {
      type: String,
      required: [true, "title is required"],
      lowercase: true
    },
    nameAR: {
      type: String,
      required: true,
      lowercase: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "Admin",
      required:true
    },
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      required: [true, "categoryId is required"],
    },
    image: {
      type: Object,
      required: [true, "image is required"],
    },
    customId: String,
  },
  {
    timestamps: true,
  }
);

const subCategoryModel = model("subCategory", subCategorySchema);
export default subCategoryModel;
