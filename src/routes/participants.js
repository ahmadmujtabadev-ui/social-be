// ── src/routes/participants.js ──────────────────────────────────────────────
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { listParticipants, createParticipant, getParticipant, updateParticipant, removeParticipant } from '../controllers/participants.js';
const routerP = express.Router();
routerP.get('/', listParticipants);
routerP.get('/:id', getParticipant);
routerP.post('/', createParticipant);
routerP.patch('/:id', updateParticipant);
routerP.delete('/:id', removeParticipant);
export default routerP;