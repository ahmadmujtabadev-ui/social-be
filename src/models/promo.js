// src/models/promo.js
import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Promo code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [0, 'Discount cannot be negative']
  },
  discountType: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: {
      values: ['percent', 'flat'],
      message: 'Discount type must be either percent or flat'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Validate that endDate is after startDate
promoSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if promo is valid
promoSchema.methods.isValid = function() {
  const now = new Date();
  const hasNotStarted = now < this.startDate;
  const hasExpired = now > this.endDate;
  const limitReached = this.usageLimit && this.usageCount >= this.usageLimit;
  
  return this.isActive && !hasNotStarted && !hasExpired && !limitReached;
};

export const Promo = mongoose.model('Promo', promoSchema);