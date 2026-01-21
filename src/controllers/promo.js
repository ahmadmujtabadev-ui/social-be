// src/controllers/promo.js
import { Promo } from '../models/promo.js';

// List all promo codes
export async function listPromos(req, res) {
  try {
    const { isActive, discountType, eventId } = req.query;
    const filter = {};
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (discountType) filter.discountType = discountType;
    if (eventId) {
      filter.$or = [
        { promoScope: 'all' },
        { applicableEvents: eventId }
      ];
    }
    
    const promos = await Promo.find(filter)
      .populate('applicableEvents', 'title')
      .sort({ createdAt: -1 });
    res.json(promos);
  } catch (e) {
    console.error('Error listing promos:', e);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
}

// Create new promo code
export async function createPromo(req, res) {
  try {
    const b = req.body;

    // Validate required fields
    if (!b.code || !b.discount || !b.discountType || !b.description || !b.startDate || !b.endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: {
          code: !b.code,
          discount: !b.discount,
          discountType: !b.discountType,
          description: !b.description,
          startDate: !b.startDate,
          endDate: !b.endDate
        }
      });
    }

    // Validate discount type
    if (!['percent', 'flat'].includes(b.discountType)) {
      return res.status(400).json({
        error: 'Invalid discount type. Must be either "percent" or "flat"'
      });
    }

    // Validate dates
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        error: 'End date must be after start date'
      });
    }

    // Validate promo scope
    const promoScope = b.promoScope || 'all';
    if (promoScope === 'specific' && (!b.applicableEvents || b.applicableEvents.length === 0)) {
      return res.status(400).json({
        error: 'Specific scope requires at least one event'
      });
    }

    const created = await Promo.create({
      code: b.code.toUpperCase(),
      discount: b.discount,
      discountType: b.discountType,
      description: b.description,
      startDate: b.startDate,
      endDate: b.endDate,
      isActive: b.isActive !== undefined ? b.isActive : true,
      usageCount: b.usageCount || 0,
      promoScope: promoScope,
      applicableEvents: promoScope === 'specific' ? b.applicableEvents : [],
      maxDiscountAmount: b.maxDiscountAmount || null,
      minPurchaseAmount: b.minPurchaseAmount || 0
    });

    const populated = await Promo.findById(created._id).populate('applicableEvents', 'title');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (e) {
    console.error('Error creating promo:', e);
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }

    if (e.code === 11000) {
      return res.status(400).json({
        error: 'Promo code already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create promo code',
      message: e.message 
    });
  }
}

// Get single promo code
export async function getPromo(req, res) {
  try {
    const promo = await Promo.findById(req.params.id).populate('applicableEvents', 'title');
    if (!promo) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    res.json(promo);
  } catch (e) {
    console.error('Error fetching promo:', e);
    res.status(500).json({ error: 'Failed to fetch promo code' });
  }
}

// Validate promo code by code string
export async function validatePromoCode(req, res) {
  try {
    const { code } = req.params;
    const { eventId, purchaseAmount } = req.query;
    
    const promo = await Promo.findOne({ code: code.toUpperCase() });
    
    if (!promo) {
      return res.status(404).json({ 
        valid: false,
        error: 'Promo code not found' 
      });
    }

    // Check basic validity
    const isValid = promo.isValid();
    
    if (!isValid) {
      const now = new Date();
      let reason = 'Promo code is not valid';
      
      if (!promo.isActive) {
        reason = 'Promo code is inactive';
      } else if (now < promo.startDate) {
        reason = 'Promo code has not started yet';
      } else if (now > promo.endDate) {
        reason = 'Promo code has expired';
      }
      
      return res.json({
        valid: false,
        error: reason,
        promo: {
          code: promo.code,
          description: promo.description
        }
      });
    }

    // Check event-specific validity
    if (eventId && !promo.isValidForEvent(eventId)) {
      return res.json({
        valid: false,
        error: 'Promo code is not valid for this event',
        promo: {
          code: promo.code,
          description: promo.description
        }
      });
    }

    // Check minimum purchase requirement
    if (purchaseAmount && parseFloat(purchaseAmount) < promo.minPurchaseAmount) {
      return res.json({
        valid: false,
        error: `Minimum purchase amount of $${promo.minPurchaseAmount} required`,
        promo: {
          code: promo.code,
          description: promo.description
        }
      });
    }

    // Calculate discount if purchase amount provided
    let discountAmount = null;
    if (purchaseAmount) {
      discountAmount = promo.calculateDiscount(parseFloat(purchaseAmount));
    }

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        discount: promo.discount,
        discountType: promo.discountType,
        description: promo.description,
        discountAmount: discountAmount,
        minPurchaseAmount: promo.minPurchaseAmount,
        maxDiscountAmount: promo.maxDiscountAmount
      }
    });
  } catch (e) {
    console.error('Error validating promo:', e);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
}

// Apply promo code (increments usage)
export async function applyPromoCode(req, res) {
  try {
    const { code } = req.params;
    const { eventId, purchaseAmount } = req.body;
    
    const promo = await Promo.findOne({ code: code.toUpperCase() });
    
    if (!promo) {
      return res.status(404).json({ 
        success: false,
        error: 'Promo code not found' 
      });
    }

    // Validate promo
    if (!promo.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Promo code is not valid'
      });
    }

    if (eventId && !promo.isValidForEvent(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Promo code is not valid for this event'
      });
    }

    if (purchaseAmount < promo.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount of $${promo.minPurchaseAmount} required`
      });
    }

    // Increment usage
    const updated = await promo.incrementUsage();
    const discountAmount = promo.calculateDiscount(purchaseAmount);
    
    res.json({
      success: true,
      promo: {
        code: updated.code,
        discount: updated.discount,
        discountType: updated.discountType,
        description: updated.description,
        discountAmount: discountAmount,
        finalAmount: Math.max(0, purchaseAmount - discountAmount)
      }
    });
  } catch (e) {
    console.error('Error applying promo:', e);
    res.status(500).json({ 
      success: false,
      error: 'Failed to apply promo code' 
    });
  }
}

// Update promo code
export async function updatePromo(req, res) {
  try {
    const b = req.body;
    const updateData = {};

    // Handle basic fields
    if (b.code) updateData.code = b.code.toUpperCase();
    if (b.discount !== undefined) updateData.discount = b.discount;
    if (b.discountType) {
      if (!['percent', 'flat'].includes(b.discountType)) {
        return res.status(400).json({
          error: 'Invalid discount type. Must be either "percent" or "flat"'
        });
      }
      updateData.discountType = b.discountType;
    }
    if (b.description) updateData.description = b.description;
    if (b.startDate) updateData.startDate = b.startDate;
    if (b.endDate) updateData.endDate = b.endDate;
    if (b.isActive !== undefined) updateData.isActive = b.isActive;
    if (b.usageCount !== undefined) updateData.usageCount = b.usageCount;
    
    // Handle event-specific fields
    if (b.promoScope !== undefined) {
      updateData.promoScope = b.promoScope;
      if (b.promoScope === 'specific') {
        if (!b.applicableEvents || b.applicableEvents.length === 0) {
          return res.status(400).json({
            error: 'Specific scope requires at least one event'
          });
        }
        updateData.applicableEvents = b.applicableEvents;
      } else {
        updateData.applicableEvents = [];
      }
    }
    if (b.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = b.maxDiscountAmount;
    if (b.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = b.minPurchaseAmount;

    // Validate dates if both are being updated
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      
      if (end <= start) {
        return res.status(400).json({
          error: 'End date must be after start date'
        });
      }
    }

    const updated = await Promo.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('applicableEvents', 'title');
    
    if (!updated) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    
    res.json(updated);
  } catch (e) {
    console.error('Error updating promo:', e);
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }

    if (e.code === 11000) {
      return res.status(400).json({
        error: 'Promo code already exists'
      });
    }
    
    res.status(500).json({ error: 'Failed to update promo code' });
  }
}

// Delete promo code
export async function removePromo(req, res) {
  try {
    const deleted = await Promo.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    
    res.json({ ok: true, message: 'Promo code deleted successfully' });
  } catch (e) {
    console.error('Error deleting promo:', e);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
}