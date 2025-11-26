import mongoose from 'mongoose';

const boothSchema = new mongoose.Schema(
  {
id: { type: Number, unique: true, required: true },
category: { type: String, enum: ['Food Vendor','Clothing Vendor','Jewelry Vendor','Craft Booth'], required: true },
price: { type: Number, required: true },
status: { type: String, enum: ['available','held','booked'], default: 'available' },
notes: String
},{ timestamps: true });

export const Booth = mongoose.model('Booth', boothSchema);
