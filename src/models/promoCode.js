import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema(
  {
code: { type: String, unique: true, uppercase: true, trim: true },
discount: { type: Number, min: 0, max: 100, required: true },
description: String, active: { type: Boolean, default: true },
startsAt: Date, endsAt: Date
},{ timestamps: true });

export const Promo = mongoose.model('Promo', promoSchema);
