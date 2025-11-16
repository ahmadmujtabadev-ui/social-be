import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
name: { type: String, required: true },
email: { type: String },
dob: { type: Date, required: true },
category: { type: String, enum: ['Dance','Musical Chair','Guess the country name','Other'], required: true },
ageGroup: { type: String, enum: ['Adults','Kids'], required: true },
phone: { type: String, required: true },
heardVia: [String],
excitement: { type: Number, min: 1, max: 5, required: true },
instagram: String,
termsAcceptedAt: Date
},{ timestamps: true });

export const Participant = mongoose.model('Participant', participantSchema);
