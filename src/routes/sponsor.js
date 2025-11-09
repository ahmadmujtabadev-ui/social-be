// ── src/routes/sponsors.js ──────────────────────────────────────────────────
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRequired } from '../middleware/auth.js';
import { listSponsors, createSponsor, getSponsor, updateSponsor, removeSponsor } from '../controllers/sponsor.js';

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const storageS = multer.diskStorage({ destination: (_r,_f,cb)=>cb(null, path.join(__dirname2, '../../uploads')), filename: (_r,f,cb)=>cb(null, `${Date.now()}_${f.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`) });
const uploadS = multer({ storage: storageS });

const routerS = express.Router();
routerS.get('/', listSponsors);
routerS.get('/:id', getSponsor);
routerS.post('/', uploadS.single('logoFile'), createSponsor);
routerS.patch('/:id', updateSponsor);
routerS.delete('/:id', removeSponsor);
export default routerS;