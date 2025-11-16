import { VolunteerFlat } from "../models/volunteer.js";

export async function createVolunteer(req, res) {
  try {
    const b = req.body;

    // Validate required fields
    if (!b.fullName || !b.email || !b.phone || !b.slot || !b.emName || !b.emRelation || !b.emPhone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: {
          fullName: !b.fullName,
          email: !b.email,
          phone: !b.phone,
          slot: !b.slot,
          emName: !b.emName,
          emRelation: !b.emRelation,
          emPhone: !b.emPhone
        }
      });
    }

    // Map slot values to display text if needed
    const slotMapping = {
      'morning': 'Morning Shift (8am - 12pm)',
      'afternoon': 'Afternoon Shift (12pm - 4pm)',
      'evening': 'Evening Shift (4pm - 8pm)',
      'fullday': 'Full Day (8am - 8pm)'
    };

    // Create volunteer with emergency contact as nested object
    const created = await VolunteerFlat.create({
      fullName: b.fullName,
      email: b.email,
      phone: b.phone,
      slot: b.slot, // Use the simple value: 'morning', 'afternoon', etc.
      // OR if you want to store the full text:
      // slot: slotMapping[b.slot] || b.slot,
      emergency: {
        name: b.emName,
        relation: b.emRelation,
        phone: b.emPhone
      },
      termsAcceptedAt: b.terms ? new Date() : undefined
    });

    res.status(201).json({
      success: true,
      data: created
    });
  } catch (e) {
    console.error('Error creating volunteer:', e);
    
    // Handle Mongoose validation errors
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }
    
    // Handle duplicate key errors (e.g., email already exists)
    if (e.code === 11000) {
      return res.status(409).json({
        error: 'A volunteer with this email already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create volunteer',
      message: e.message 
    });
  }
}

