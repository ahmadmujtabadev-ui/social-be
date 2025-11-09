// src/models/sponsor.js
import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    oneLiner: String,
    category: {
      type: String,
      enum: ['PLATINUM SPONSOR', 'GOLD SPONSOR', 'SILVER SPONSOR'],
      required: true
    },
    logoPath: String,
    termsAcceptedAt: Date,
    status: {
      type: String,
      enum: ['submitted', 'approved', 'rejected'],
      default: 'submitted'
    }
  },
  { timestamps: true }
);

export const Sponsor = mongoose.model('Sponsor', sponsorSchema);
