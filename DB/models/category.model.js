import { Schema, model, Types } from "mongoose";

const categorySchema = new Schema(
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
      required: true
    },
    image: {
      type: Object,
    },
    facilities: { type: [String] },
    customId: String
  },
  // { id: false },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

categorySchema.virtual('subCategory', {
  ref: 'subCategory',
  localField: '_id',
  foreignField: 'categoryId',
});


categorySchema.virtual('properties', {
  ref: 'Property',
  localField: '_id',
  foreignField: 'categoryId',
});

const categoryModel = model("Category", categorySchema);
export default categoryModel;
