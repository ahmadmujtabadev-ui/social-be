// src/routes/promo.js
import express from 'express';
import { 
  listPromos, 
  createPromo, 
  getPromo, 
  validatePromoCode,
  updatePromo, 
  removePromo 
} from '../controllers/promo.js';

const router = express.Router();

// Public routes
router.get('/get', listPromos);
router.get('/:id', getPromo);
router.get('/validate/:code', validatePromoCode); // Special route to validate by code string

// Protected routes
router.post('/', createPromo);
router.put('/:id', updatePromo);
router.delete('/:id', removePromo);

export default router;