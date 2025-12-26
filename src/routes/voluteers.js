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

routerV.get('/', listVolunteers);

routerV.get('/:id', getVolunteer);

routerV.post('/', createVolunteer);

routerV.patch('/:id', updateVolunteer);

routerV.delete('/:id', removeVolunteer);

export default routerV;