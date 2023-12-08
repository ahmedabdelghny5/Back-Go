import { Schema, model, Types } from "mongoose";

const ownerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      lowercase: true,
      minLength: [2, "name is too short"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email is unique"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    phone: {
      type: String,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    loggedIn: { type: Boolean, default: false, },
    frontId: { type: Object, required: [true, "card photo front is required"] },
    backId: { type: Object, required: [true, "card photo back is required"] },
    nationalId: { type: String, required: [true, "nationalId is required"] },
    image: { type: Object, required: [true, "your image is required"] },
    accepted: { type: Boolean, default: false },
    country: String,
    soldItems: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    numberOfRates: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    socketId: String,
    codeInfo: { code: String, createdAt: Date },
    customId: String,
    changePassAt: Date,
    provider: { type: String, enum: ['google', 'facebook', 'system'], default: 'system' },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);
ownerSchema.virtual("Property", {
  ref: "Property",
  foreignField: "ownerId",
  localField: "_id",
  
})

ownerSchema.virtual("Review", {
  ref: "Review",
  foreignField: "ownerId",
  localField: "_id"
})

const ownerModel = model("Owner", ownerSchema);

export default ownerModel
