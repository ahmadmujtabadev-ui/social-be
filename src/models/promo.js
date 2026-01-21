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
  usageCount: {
    type: Number,
    default: 0
  },
  // Event-specific promos
  applicableEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  promoScope: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  // Maximum discount cap for percentage discounts
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  // Minimum purchase requirement
  minPurchaseAmount: {
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
  
  return this.isActive && !hasNotStarted && !hasExpired;
};

// Method to check if promo is valid for specific event
promoSchema.methods.isValidForEvent = function(eventId) {
  if (!this.isValid()) return false;
  
  if (this.promoScope === 'all') return true;
  
  if (this.promoScope === 'specific') {
    return this.applicableEvents.some(id => id.toString() === eventId.toString());
  }
  
  return false;
};

// Method to calculate discount amount
promoSchema.methods.calculateDiscount = function(purchaseAmount) {
  if (purchaseAmount < this.minPurchaseAmount) {
    return 0;
  }
  
  let discountAmount = 0;
  
  if (this.discountType === 'percent') {
    discountAmount = (purchaseAmount * this.discount) / 100;
    
    // Apply max discount cap if set
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else {
    discountAmount = this.discount;
  }
  
  // Ensure discount doesn't exceed purchase amount
  return Math.min(discountAmount, purchaseAmount);
};

// Increment usage count
promoSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return await this.save();
};

export const Promo = mongoose.model('Promo', promoSchema);