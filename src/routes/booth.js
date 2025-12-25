// ── src/routes/booths.js ───────────────────────────────────────────────────
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { listBooths, createMultipleBooths, getBooth, updateBooth, removeBooth } from '../controllers/booth.js';

const routerB = express.Router();
routerB.get('/', listBooths);
routerB.get('/:id', authRequired, getBooth);
routerB.post('/', createMultipleBooths);
routerB.put('/:id', updateBooth);
routerB.delete('/:id', authRequired, removeBooth);
export default routerB;