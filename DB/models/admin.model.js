import { Schema, model, Types } from 'mongoose';


const adminSchema = new Schema({
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
    password: { type: String, required: [true, "password is required"], },
    phone: { type: String },
    image: { type: Object},
    confirmed: { type: Boolean, default: false, },
    loggedIn: { type: Boolean, default: false, },
    codeInfo: { code: String, createdAt: Date },
    customId: String,
    changePassAt: Date,
    role: {
        type: String,
        enum: ['Admin', 'superAdmin'],
        default: 'Admin',
    },
    provider: { type: String, enum: ['google', 'facebook', 'system'], default: 'system' },
},
    {
        timestamps: true,
    }
)

const adminModel = model('Admin', adminSchema)
export default adminModel