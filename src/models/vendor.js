// vendor.model.js
import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true },
    contact: {
      personName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      isOakville: { type: Boolean, required: true },
    },
    socials: { instagram: String, facebook: String },

    category: {
      type: String,
      enum: ["Food Vendor", "Clothing Vendor", "Jewelry Vendor", "Craft Booth", "Henna Booth"],
      required: true,
    },

    businessLogoPath: String,

    food: { items: String, photoPaths: [String], needPower: Boolean, watts: Number },
    clothing: { clothingType: String, photoPaths: [String] },
    jewelry: { jewelryType: String, photoPaths: [String] },
    craft: { details: String, photoPaths: [String], needPower: Boolean, watts: Number },

    // keep boothNumber same type for FE compatibility
    boothNumber: { type: String, required: true },

    // NEW (derived from catalog)
    boothCategory: { type: String },
    boothPrice: { type: Number, required: true },

    pricing: {
      base: Number,
      promoCode: String,
      promoDiscount: Number,
      promoDiscountType: { type: String, enum: ["percent", "flat"], default: "percent" },
      final: Number,
    },

    selectedEvent: { type: String, required: true },

    bookingTimeline: {
      submittedAt: Date,
      heldUntil: Date,
      confirmedAt: Date,
      paidAt: Date,
    },

    notes: String,
    termsAcceptedAt: Date,

    status: {
      type: String,
      enum: ["submitted", "held", "confirmed", "under_review", "approved", "rejected", "paid", "cancelled", "expired"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// Only one ACTIVE vendor per booth per event
vendorSchema.index(
  { selectedEvent: 1, boothNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["held", "confirmed", "under_review", "approved", "paid"] },
    },
  }
);

// For expiry scans
vendorSchema.index({ status: 1, "bookingTimeline.heldUntil": 1 });

export const Vendor = mongoose.model("Vendor", vendorSchema);
