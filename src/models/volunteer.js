// src/models/volunteer.js
import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema({
  // NEW: Event reference (required)
  selectedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event selection is required'],
    index: true
  },
  
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
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
    required: [true, 'Phone number is required'],
    trim: true
  },
  
  slot: {
    type: String,
    required: [true, 'Volunteer slot is required'],
    enum: [
      'Afternoon Shift (2pm - 6pm)',
      'Evening Shift (5pm - 9pm)',
      'Night Shift (7pm - 11pm)',
      'Full Day (4pm - 11pm)'
    ]
  },
  
  emergency: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relation: {
      type: String,
      required: [true, 'Emergency contact relation is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true
    }
  },
  
  termsAcceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate email per event
volunteerSchema.index({ email: 1, selectedEvent: 1 }, { unique: true });

export const VolunteerFlat = mongoose.models.VolunteerFlat || mongoose.model('VolunteerFlat', volunteerSchema);