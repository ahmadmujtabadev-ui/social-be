// ── src/routes/volunteers.js ──────────────────────────────────────────────
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { 
  listVolunteers, 
  createVolunteer, 
  getVolunteer, 
  updateVolunteer, 
  removeVolunteer 
} from '../controllers/volunteers.js';

const routerV = express.Router();

// GET /api/v1/volunteers - List all volunteers (protected)
routerV.get('/', listVolunteers);

// GET /api/v1/volunteers/:id - Get single volunteer (protected)
routerV.get('/:id', getVolunteer);

// POST /api/v1/volunteers - Create new volunteer (public for registration)
routerV.post('/', createVolunteer);

// PATCH /api/v1/volunteers/:id - Update volunteer (protected)
routerV.patch('/:id', updateVolunteer);

// DELETE /api/v1/volunteers/:id - Delete volunteer (protected)
routerV.delete('/:id', removeVolunteer);

export default routerV;