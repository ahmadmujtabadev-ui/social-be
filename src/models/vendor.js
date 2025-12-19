// ============================================
// Vendor Model (vendor.model.js)
// ============================================

import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true },
    contact: {
      personName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      isOakville: { type: Boolean, required: true }
    },
    socials: { instagram: String, facebook: String },
    category: { 
      type: String, 
      enum: ['Food Vendor', 'Clothing Vendor', 'Jewelry Vendor', 'Craft Booth', 'Henna Booth'], 
      required: true 
    },
    businessLogoPath: String,
   
    food: { items: String, photoPaths: [String], needPower: Boolean, watts: Number },
    clothing: { clothingType: String, photoPaths: [String] },
    jewelry: { jewelryType: String, photoPaths: [String] },
    craft: { details: String, photoPaths: [String], needPower: Boolean, watts: Number },
    
    boothNumber: String,
    boothRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Booth' },
    
    pricing: { 
      base: Number, 
      promoCode: String, 
      promoDiscount: Number,
      promoDiscountType: { 
        type: String, 
        enum: ['percent', 'flat'],
        default: 'percent'
      },
      final: Number 
    },
    
    // NEW: Track booking timeline
    bookingTimeline: {
      submittedAt: Date,
      heldUntil: Date, // 48-hour deadline
      confirmedAt: Date,
      paidAt: Date
    },
    
    notes: String,
    termsAcceptedAt: Date,
    status: { 
      type: String, 
      enum: ['submitted', 'held', 'confirmed', 'under_review', 'approved', 'rejected', 'paid', 'cancelled', 'expired'], 
      default: 'submitted' 
    }
  }, 
  { timestamps: true }
);

export const Vendor = mongoose.model('Vendor', vendorSchema);