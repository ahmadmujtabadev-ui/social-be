// src/controllers/promo.js
import { Promo } from '../models/promo.js';

// List all promo codes
export async function listPromos(req, res) {
  try {
    const { isActive, discountType } = req.query;
    const filter = {};
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (discountType) filter.discountType = discountType;
    
    const promos = await Promo.find(filter).sort({ createdAt: -1 });
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

    const created = await Promo.create({
      code: b.code.toUpperCase(),
      discount: b.discount,
      discountType: b.discountType,
      description: b.description,
      startDate: b.startDate,
      endDate: b.endDate,
      isActive: b.isActive !== undefined ? b.isActive : true,
      usageLimit: b.usageLimit || null,
      usageCount: b.usageCount || 0
    });

    res.status(201).json({
      success: true,
      data: created
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
    const promo = await Promo.findById(req.params.id);
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
    const promo = await Promo.findOne({ code: code.toUpperCase() });
    
    if (!promo) {
      return res.status(404).json({ 
        valid: false,
        error: 'Promo code not found' 
      });
    }

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
      } else if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
        reason = 'Promo code usage limit reached';
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

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        discount: promo.discount,
        discountType: promo.discountType,
        description: promo.description
      }
    });
  } catch (e) {
    console.error('Error validating promo:', e);
    res.status(500).json({ error: 'Failed to validate promo code' });
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
    if (b.usageLimit !== undefined) updateData.usageLimit = b.usageLimit;
    if (b.usageCount !== undefined) updateData.usageCount = b.usageCount;

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
    );
    
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