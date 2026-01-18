// src/models/vendor.js
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  // Event reference (required)
  selectedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event selection is required'],
    index: true
  },
  
  vendorName: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  
  boothNumber: {
    type: String,
    required: [true, 'Booth number is required'],
    trim: true
  },
  
  contact: {
    personName: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true
    }
  },
  
  description: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'held'], // ONLY booked and confirmed allowed
    default: 'booked'
  },
  
  termsAcceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index: booth number must be unique per event
vendorSchema.index({ boothNumber: 1, selectedEvent: 1 }, { unique: true });

// Index for filtering
vendorSchema.index({ status: 1, selectedEvent: 1 });

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema)