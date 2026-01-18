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
    
    // NEW: Single DateTime field (replaces date + time strings)
    eventDateTime: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(value) {
          // Prevent past dates during creation
          if (this.isNew) {
            return value >= new Date();
          }
          // During updates, allow if not being changed or if future
          return true;
        },
        message: 'Event date/time cannot be in the past'
      }
    },
    
    // DEPRECATED: Keep temporarily for migration
    date: { 
      type: String, 
      required: false  // Make optional during migration
    },
    
    time: { 
      type: String, 
      required: false  // Make optional during migration
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

// Index for faster queries on active/upcoming events
eventSchema.index({ status: 1, isActive: 1, eventDateTime: 1 });
eventSchema.index({ eventDateTime: 1 });

// Virtual for backward compatibility (returns formatted date)
eventSchema.virtual('formattedDate').get(function() {
  if (this.eventDateTime) {
    return this.eventDateTime.toLocaleDateString();
  }
  return this.date || '';
});

// Virtual for backward compatibility (returns formatted time)
eventSchema.virtual('formattedTime').get(function() {
  if (this.eventDateTime) {
    return this.eventDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return this.time || '';
});

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export const Event = mongoose.model("Event", eventSchema);


// // src/models/event.js
// import mongoose from "mongoose";

// const eventSchema = new mongoose.Schema(
//   {
//     title: { 
//       type: String, 
//       required: true,
//       trim: true 
//     },
    
//     badge: { 
//       type: String, 
//       required: true,
//       trim: true 
//     },
    
//     date: { 
//       type: String, 
//       required: true 
//     },
    
//     time: { 
//       type: String, 
//       required: true 
//     },
    
//     location: { 
//       type: String, 
//       required: true,
//       trim: true 
//     },
    
//     description: { 
//       type: String, 
//       required: true 
//     },
    
//     highlights: [{ 
//       type: String 
//     }],
    
//     primaryCta: {
//       label: { type: String, required: true },
//       href: { type: String, required: true }
//     },
    
//     secondaryCta: {
//       label: { type: String, required: true },
//       href: { type: String, required: true }
//     },
    
//     status: {
//       type: String,
//       enum: ["draft", "published", "archived"],
//       default: "draft"
//     },
    
//     isActive: {
//       type: Boolean,
//       default: true
//     }
//   },
//   { 
//     timestamps: true 
//   }
// );

// // Index for faster queries
// eventSchema.index({ status: 1, isActive: 1, createdAt: -1 });

// export const Event = mongoose.model("Event", eventSchema);