// ── src/controllers/volunteers.js ─────────────────────────────────────────
import { VolunteerFlat } from '../models/volunteer.js';

export async function listVolunteers(_req, res) {
  try {
    const volunteers = await VolunteerFlat.find().sort({ createdAt: -1 });
    res.json(volunteers);
  } catch (e) {
    console.error('Error listing volunteers:', e);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
}

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

    // Create volunteer with emergency contact as nested object
    const created = await VolunteerFlat.create({
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

export async function getVolunteer(req, res) {
  try {
    const volunteer = await VolunteerFlat.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    res.json(volunteer);
  } catch (e) {
    console.error('Error fetching volunteer:', e);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
}

export async function updateVolunteer(req, res) {
  try {
    const updated = await VolunteerFlat.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
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