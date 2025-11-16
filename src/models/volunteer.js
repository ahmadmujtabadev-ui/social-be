import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  relation: {
    type: String,
  },
  phone: {
    type: String,
  }
}, { _id: false }); // _id: false prevents creating separate IDs for subdocuments

const volunteerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  slot: {
    type: String,
    required: [true, 'Volunteer slot is required'],
    enum: {
      values: ['morning', 'afternoon', 'evening', 'fullday'],
      message: '{VALUE} is not a valid slot option'
    }
  },
  emergency: {
    type: emergencyContactSchema,
  },
  termsAcceptedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create index on email for faster lookups
volunteerSchema.index({ email: 1 });

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

export default Volunteer;

// Alternative flat schema (if nested objects cause issues):
const volunteerSchemaFlat = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  slot: {
    type: String,
  },
  emergencyName: {
    type: String,
  },
  emergencyRelation: {
    type: String,
  },
  emergencyPhone: {
    type: String,
  },
  termsAcceptedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export const VolunteerFlat = mongoose.model('VolunteerFlat', volunteerSchemaFlat);