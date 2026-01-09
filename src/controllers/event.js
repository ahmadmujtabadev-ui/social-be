// src/controllers/event.js
import { Event } from '../models/event.js';

// List all events
export async function listEvents(req, res) {
  try {
    const { status, isActive } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (e) {
    console.error('Error listing events:', e);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

// Create new event
export async function createEvent(req, res) {
  try {
    const b = req.body;

    // Validate required fields
    if (!b.title || !b.badge || !b.date || !b.time || !b.location || !b.description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: {
          title: !b.title,
          badge: !b.badge,
          date: !b.date,
          time: !b.time,
          location: !b.location,
          description: !b.description
        }
      });
    }

    // Validate CTAs
    if (!b.primaryCtaLabel || !b.primaryCtaHref) {
      return res.status(400).json({
        error: 'Primary CTA label and href are required'
      });
    }

    if (!b.secondaryCtaLabel || !b.secondaryCtaHref) {
      return res.status(400).json({
        error: 'Secondary CTA label and href are required'
      });
    }

    const created = await Event.create({
      title: b.title,
      badge: b.badge,
      date: b.date,
      time: b.time,
      location: b.location,
      description: b.description,
      highlights: b.highlights || [],
      primaryCta: {
        label: b.primaryCtaLabel,
        href: b.primaryCtaHref
      },
      secondaryCta: {
        label: b.secondaryCtaLabel,
        href: b.secondaryCtaHref
      },
      status: b.status || 'draft',
      isActive: b.isActive !== undefined ? b.isActive : true
    });

    res.status(201).json({
      success: true,
      data: created
    });
  } catch (e) {
    console.error('Error creating event:', e);
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create event',
      message: e.message 
    });
  }
}

// Get single event
export async function getEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (e) {
    console.error('Error fetching event:', e);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

// Update event
export async function updateEvent(req, res) {
  try {
    const b = req.body;
    const updateData = {};

    // Handle basic fields
    if (b.title) updateData.title = b.title;
    if (b.badge) updateData.badge = b.badge;
    if (b.date) updateData.date = b.date;
    if (b.time) updateData.time = b.time;
    if (b.location) updateData.location = b.location;
    if (b.description) updateData.description = b.description;
    if (b.highlights) updateData.highlights = b.highlights;
    if (b.status) updateData.status = b.status;
    if (b.isActive !== undefined) updateData.isActive = b.isActive;

    // Handle CTAs
    if (b.primaryCtaLabel || b.primaryCtaHref) {
      updateData.primaryCta = {
        label: b.primaryCtaLabel,
        href: b.primaryCtaHref
      };
    }

    if (b.secondaryCtaLabel || b.secondaryCtaHref) {
      updateData.secondaryCta = {
        label: b.secondaryCtaLabel,
        href: b.secondaryCtaHref
      };
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(updated);
  } catch (e) {
    console.error('Error updating event:', e);
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ error: 'Failed to update event' });
  }
}

// Delete event
export async function removeEvent(req, res) {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ ok: true, message: 'Event deleted successfully' });
  } catch (e) {
    console.error('Error deleting event:', e);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}