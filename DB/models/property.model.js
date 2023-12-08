import { Schema, model, Types } from "mongoose";

const propertySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      unique: [true, "name is required"],
      lowercase: true
    },
    location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    mainImage: { type: Object, required: [true, "mainImage is required"] },
    subImages: { type: [Object], required: [true, "subImages is required"] },
    video: Object,
    categoryId: { type: Types.ObjectId, ref: "Category" },
    subcategoryId: { type: Types.ObjectId, ref: "subCategory" },
    ownerId: { type: Types.ObjectId, ref: "Owner" },
    rate: { type: Number, default: 0 },
    numberOfRates: { type: Number, default: 0 },
    accepted: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    facilities: { type: [String] },
    features: { type: [String] },
    country: { type: Types.ObjectId, ref: "Country", required: true },
    customId: { type: String },
    description: { type: String },
    type: { type: String, enum: ["Rent", "Sell"] },
    rentType: { type: String, enum: ["Daily","Yearly","Monthly"] },//Todo []
    price: { type: Number },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: [true, "finalPrice is required"] },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

propertySchema.virtual("Review", {
  ref: "Review",
  foreignField: "propertyId",
  localField: "_id"
})

propertySchema.virtual("Rent", {
  ref: "Rent",
  foreignField: "property.propertyId",
  localField: "_id"
})

const propertyModel = model("Property", propertySchema);

export default propertyModel
