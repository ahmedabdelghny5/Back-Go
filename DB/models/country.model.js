import { Schema, model } from "mongoose";

const countrySchema = new Schema(
  {
    name: { type: String, required: true, lowercase: true },
    image: { type: Object, required: [true, "image is required"] },
    subImages: { type: [Object], required: [true, "subImages is required"] },
    customId: String
  },
  // { id: false },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,

  }
);

countrySchema.virtual('properties', {
  localField: '_id',
  foreignField: "country",
  ref: "Property"
})
const countryModel = model("Country", countrySchema);
export default countryModel;
