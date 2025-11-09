// ── src/routes/participants.js ──────────────────────────────────────────────
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { listParticipants, createParticipant, getParticipant, updateParticipant, removeParticipant } from '../controllers/participants.js';
const routerP = express.Router();
routerP.get('/', authRequired, listParticipants);
routerP.get('/:id', authRequired, getParticipant);
routerP.post('/', createParticipant);
routerP.patch('/:id', authRequired, updateParticipant);
routerP.delete('/:id', authRequired, removeParticipant);
export default routerP;