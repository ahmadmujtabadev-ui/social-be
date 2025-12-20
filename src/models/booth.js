// Booth Model (booth.model.js)
import mongoose from 'mongoose';

const boothSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, required: true },
    category: { 
      type: String, 
      enum: ['Food Vendor','Clothing Vendor','Jewelry Vendor','Craft Booth'], 
      required: true 
    },
    price: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['available','held','booked','confirmed'], 
      default: 'available' 
    },
    heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // Track who holds it
    heldUntil: { type: Date }, // 48-hour expiry timestamp
    notes: String
  },
  { timestamps: true }
);

// Index for efficient queries
boothSchema.index({ status: 1, heldUntil: 1 });

export const Booth = mongoose.model('Booth', boothSchema);