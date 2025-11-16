import mongoose, { Schema } from 'mongoose';

// --- Updated Vendor Schema ---
const vendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true },
    contact: {
      personName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      isOakville: { type: Boolean, required: true }
    },
    socials: { 
      instagram: String, 
      facebook: String 
    },
    category: { 
      type: String, 
      enum: ['Food Vendor', 'Clothing Vendor', 'Jewelry Vendor', 'Craft Booth', 'Henna Booth'], 
      required: true 
    },
    businessLogoPath: String,
   
    food: { 
      items: String, 
      photoPaths: [String], 
      needPower: Boolean, 
      watts: Number 
    },
    clothing: { 
      clothingType: String, 
      photoPaths: [String] 
    },
    jewelry: { 
      jewelryType: String, 
      photoPaths: [String] 
    },
    craft: { 
      details: String, 
      photoPaths: [String], 
      needPower: Boolean, 
      watts: Number 
    },
    
    // Updated to support multiple booths
    // boothNumber:, // Array of booth numbers

     boothNumber: { 
      type: String, 
    },

    boothRefs: [{ type: Schema.Types.ObjectId, ref: 'Booth' }], // Array of booth references
    
    // Updated pricing to support flat and percent discounts
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
    
    notes: String,
    termsAcceptedAt: Date,
    status: { 
      type: String, 
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled'], 
      default: 'submitted' 
    }
  }, 
  { timestamps: true }
);

export const Vendor = mongoose.model('Vendor', vendorSchema);