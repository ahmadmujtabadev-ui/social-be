// src/controllers/sponsors.js
import { Sponsor } from '../models/sponser.js';

// List sponsors with event filtering
export async function listSponsors(req, res) {
  try {
    const { eventId, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    // Apply event filter if provided
    if (eventId) {
      filter.selectedEvent = eventId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sponsors, total] = await Promise.all([
      Sponsor.find(filter)
        .populate('selectedEvent', 'title eventDateTime location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sponsor.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: sponsors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    console.error('Error listing sponsors:', e);
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
}

// Create sponsor
export async function createSponsor(req, res) {
  try {
    const b = req.body;

    // Validate selectedEvent first
    if (!b.selectedEvent) {
      return res.status(400).json({ 
        error: "Missing required field: selectedEvent" 
      });
    }

    // Normalize category
    const map = {
      Platinum: "PLATINUM SPONSOR",
      Gold: "GOLD SPONSOR",
      Silver: "SILVER SPONSOR",
    };
    const category = map[b.category?.trim()] || b.category?.trim();

    // Validate other required fields
    if (!b.businessName || !b.ownerName || !b.email || !b.phone || !category) {
      return res.status(400).json({ 
        error: "Missing required fields",
        missing: {
          selectedEvent: !b.selectedEvent,
          businessName: !b.businessName,
          ownerName: !b.ownerName,
          email: !b.email,
          phone: !b.phone,
          category: !category
        }
      });
    }

    const doc = {
      selectedEvent: b.selectedEvent,
      businessName: b.businessName,
      ownerName: b.ownerName,
      email: b.email,
      phone: b.phone,
      oneLiner: b.oneLiner,
      instagram: b.instagram,
      facebook: b.facebook,
      category,
      comments: b.comments,
      logoPath: req.file?.path,
      termsAcceptedAt: String(b.terms).toLowerCase() === "true" ? new Date() : undefined,
    };

    const created = await Sponsor.create(doc);
    
    // Populate event details
    await created.populate('selectedEvent', 'title eventDateTime location');
    
    return res.status(201).json({
      success: true,
      message: 'Sponsor application submitted successfully!',
      sponsor: created
    });
  } catch (e) {
    // Expose validation errors clearly
    if (e.name === "ValidationError") {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }
    
    // Handle duplicate entries (email already exists for this event)
    if (e.code === 11000) {
      return res.status(409).json({
        error: 'You have already submitted a sponsorship application for this event'
      });
    }
    
    console.error("createSponsor error:", e);
    return res.status(500).json({ 
      error: "Failed to create sponsor",
      message: e.message 
    });
  }
}

// Get single sponsor
export async function getSponsor(req, res) {
  try {
    const sponsor = await Sponsor.findById(req.params.id)
      .populate('selectedEvent', 'title eventDateTime location');
      
    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    res.json(sponsor);
  } catch (e) {
    console.error('Error fetching sponsor:', e);
    res.status(500).json({ error: 'Failed to fetch sponsor' });
  }
}

// Update sponsor
export async function updateSponsor(req, res) {
  try {
    const updated = await Sponsor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('selectedEvent', 'title eventDateTime location');
    
    if (!updated) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    
    res.json(updated);
  } catch (e) {
    console.error('Error updating sponsor:', e);
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ error: 'Failed to update sponsor' });
  }
}

// Delete sponsor
export async function removeSponsor(req, res) {
  try {
    const deleted = await Sponsor.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    
    res.json({ ok: true, message: 'Sponsor deleted successfully' });
  } catch (e) {
    console.error('Error deleting sponsor:', e);
    res.status(500).json({ error: 'Failed to delete sponsor' });
  }
}