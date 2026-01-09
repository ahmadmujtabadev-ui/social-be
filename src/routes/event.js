// src/routes/event.js
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { 
  listEvents, 
  createEvent, 
  getEvent, 
  updateEvent, 
  removeEvent 
} from '../controllers/event.js';

const router = express.Router();

// Public routes
router.get('/', listEvents);
router.get('/:id', getEvent);

// Protected routes
router.post('/', authRequired, createEvent);
router.put('/:id', authRequired, updateEvent);
router.delete('/:id', authRequired, removeEvent);

export default router;