import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { listVendors, createVendor, getVendor, updateVendor, removeVendor, allstats } from '../controllers/vendor.js';
import { upload } from '../config/upload.js';
import { createPromo } from '../controllers/promo.js';

const router = express.Router();
router.post('/getallstats', allstats);
router.get('/', listVendors);
router.get('/:id', authRequired, getVendor);
router.post('/', upload, createVendor);
router.post("/create", createPromo)

router.put('/update/:id', updateVendor);
router.delete('/:id', removeVendor);

export default router;

