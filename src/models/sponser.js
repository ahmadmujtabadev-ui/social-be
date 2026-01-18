// ============================================
// src/models/sponsor.js
// ============================================
import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema({
  // Event reference (required)
  selectedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event selection is required'],
    index: true
  },

  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  
  oneLiner: {
    type: String,
    trim: true
  },
  
  instagram: {
    type: String,
    trim: true
  },
  
  facebook: {
    type: String,
    trim: true
  },
  
  category: {
    type: String,
    enum: ['PLATINUM SPONSOR', 'GOLD SPONSOR', 'SILVER SPONSOR'],
    required: [true, 'Sponsor category is required']
  },
  
  logoPath: {
    type: String
  },
  
  comments: {
    type: String,
    trim: true
  },
  
  termsAcceptedAt: {
    type: Date,
    default: null
  },
  
  status: {
    type: String,
    enum: ['submitted', 'approved', 'rejected'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Compound unique index: email must be unique per event
sponsorSchema.index({ email: 1, selectedEvent: 1 }, { unique: true });

// Index for filtering
sponsorSchema.index({ category: 1, selectedEvent: 1 });
sponsorSchema.index({ status: 1, selectedEvent: 1 });

export const Sponsor = mongoose.models.Sponsor || mongoose.model('Sponsor', sponsorSchema);
