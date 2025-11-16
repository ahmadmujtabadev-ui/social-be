import mongoose from 'mongoose';

// --- Updated Promo Schema ---
const promoSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      unique: true, 
      uppercase: true, 
      trim: true,
      required: true
    },
    discount: { 
      type: Number, 
      required: true,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percent', 'flat'],
      default: 'percent',
      required: true
    },
    description: String,
    active: { 
      type: Boolean, 
      default: true 
    },
    startsAt: { 
      type: Date,
      default: Date.now
    },
    endsAt: Date
  },
  { timestamps: true }
);

// Index for faster lookups
promoSchema.index({ code: 1, active: 1 });

// Validation: percent discounts should be 0-100
promoSchema.pre('save', function(next) {
  if (this.discountType === 'percent' && this.discount > 100) {
    next(new Error('Percent discount cannot exceed 100'));
  }
  next();
});

export const Promo = mongoose.model('Promo', promoSchema);