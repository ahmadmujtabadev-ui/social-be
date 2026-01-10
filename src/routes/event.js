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
router.get('/get', listEvents);
router.get('/:id', getEvent);

// Protected routes
router.post('/' , createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', removeEvent);

export default router;