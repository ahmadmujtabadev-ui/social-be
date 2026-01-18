// src/controllers/volunteers.js
import { VolunteerFlat } from '../models/volunteer.js';

// List volunteers with event filtering
export async function listVolunteers(req, res) {
  try {
    const { eventId, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    // Apply event filter if provided
    if (eventId) {
      filter.selectedEvent = eventId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [volunteers, total] = await Promise.all([
      VolunteerFlat.find(filter)
        .populate('selectedEvent', 'title eventDateTime location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      VolunteerFlat.countDocuments(filter)
    ]);
    console.log("voluters",volunteers)
    
    res.json({
      success: true,
      data: volunteers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    console.error('Error listing volunteers:', e);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
}

// Create volunteer
export async function createVolunteer(req, res) {
  try {
    const b = req.body;

    // Validate required fields including selectedEvent
    if (!b.selectedEvent || !b.fullName || !b.email || !b.phone || !b.slot || !b.emName || !b.emRelation || !b.emPhone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: {
          selectedEvent: !b.selectedEvent,
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

    // Create volunteer with emergency contact as nested object
    const created = await VolunteerFlat.create({
      selectedEvent: b.selectedEvent,
      fullName: b.fullName,
      email: b.email,
      phone: b.phone,
      slot: b.slot,
      emergency: {
        name: b.emName,
        relation: b.emRelation,
        phone: b.emPhone
      },
      termsAcceptedAt: b.terms ? new Date() : undefined
    });

    // Populate event details
    await created.populate('selectedEvent', 'title eventDateTime location');

    res.status(201).json({
      success: true,
      message: 'Volunteer registration successful!',
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
    
    // Handle duplicate key errors (email already exists for this event)
    if (e.code === 11000) {
      return res.status(409).json({
        error: 'You have already registered as a volunteer for this event'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create volunteer',
      message: e.message 
    });
  }
}

// Get single volunteer
export async function getVolunteer(req, res) {
  try {
    const volunteer = await VolunteerFlat.findById(req.params.id)
      .populate('selectedEvent', 'title eventDateTime location');
      
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    res.json(volunteer);
  } catch (e) {
    console.error('Error fetching volunteer:', e);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
}

// Update volunteer
export async function updateVolunteer(req, res) {
  try {
    const updated = await VolunteerFlat.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('selectedEvent', 'title eventDateTime location');
    
    if (!updated) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(updated);
  } catch (e) {
    console.error('Error updating volunteer:', e);
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
}

// Delete volunteer
export async function removeVolunteer(req, res) {
  try {
    const deleted = await VolunteerFlat.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json({ ok: true, message: 'Volunteer deleted successfully' });
  } catch (e) {
    console.error('Error deleting volunteer:', e);
    res.status(500).json({ error: 'Failed to delete volunteer' });
  }
}