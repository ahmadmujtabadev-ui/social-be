// src/models/event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true 
    },
    
    badge: { 
      type: String, 
      required: true,
      trim: true 
    },
    
    date: { 
      type: String, 
      required: true 
    },
    
    time: { 
      type: String, 
      required: true 
    },
    
    location: { 
      type: String, 
      required: true,
      trim: true 
    },
    
    description: { 
      type: String, 
      required: true 
    },
    
    highlights: [{ 
      type: String 
    }],
    
    primaryCta: {
      label: { type: String, required: true },
      href: { type: String, required: true }
    },
    
    secondaryCta: {
      label: { type: String, required: true },
      href: { type: String, required: true }
    },
    
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
eventSchema.index({ status: 1, isActive: 1, createdAt: -1 });

export const Event = mongoose.model("Event", eventSchema);