import mongoose from "mongoose";
import { IAddress } from "../types/index.js";

const addressSchema = new mongoose.Schema<IAddress>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ["Home", "Work", "Other"],
        required: true,
    },
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zipCode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Address = mongoose.model<IAddress>("Address", addressSchema);

export default Address;