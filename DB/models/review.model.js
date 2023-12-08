import { Schema, model, Types } from "mongoose";

const reviewSchema = new Schema(
  {
    comment: { type: String, required: true },
    rate: { type: Number, min: 1, max: 5, required: [true, "rate is required"] },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
    },
    ownerId: {
      type: Types.ObjectId,
      ref: "Owner",
    },
  },
  {
    timestamps: true,
  }
);

const reviewModel = model("Review", reviewSchema);
export default reviewModel;
