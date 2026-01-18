
// ============================================
// src/models/participant.js
// ============================================
import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  // Event reference (required)
  selectedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event selection is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
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
  
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  
  category: {
    type: String,
    enum: ['KIDS', 'TEENS', 'ADULTS', 'SENIORS'],
    required: [true, 'Category is required']
  },
  
  ageGroup: {
    type: String,
    enum: ['UNDER_12', '13_17', '18_35', '36_50', 'ABOVE_50'],
    required: [true, 'Age group is required']
  },
  
  excitement: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  termsAcceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index: email must be unique per event
participantSchema.index({ email: 1, selectedEvent: 1 }, { unique: true });

// Index for filtering
participantSchema.index({ category: 1, selectedEvent: 1 });

export const Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema);