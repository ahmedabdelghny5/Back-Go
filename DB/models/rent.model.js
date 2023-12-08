import { Schema, model, Types } from "mongoose";

const rentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User" },
    property: {
      name: { type: String },
      propertyId: { type: Types.ObjectId, ref: "Property", required: [true, "propertyId is required"] },
      image: { type: Object },
      area: { type: Number },
      price: { type: Number },
      discount: { type: Number },
      unitPrice: { type: Number },
      ownerId: { type: Types.ObjectId, ref: "Owner" },
    },
    totalPrice: { type: Number },
    phone: { type: String, required: [true, "phone is required"] },
    paymentMethod: { type: String, enum: ["cash", "card"], required: true },
    status: {
      type: String,
      enum: ["done", "waitPayment", "cancel", "rejected"],
    },
    accepted: { type: Boolean, default: false },
    fromDate: Date,
    toDate: Date,
    contractLink: String,
    note: String,
    reason: String,
  },
  {
    timestamps: true,
  }
);

const rentModel = model("Rent", rentSchema);
export default rentModel;
