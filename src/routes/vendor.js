import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRequired } from '../middleware/auth.js';
import { listVendors, createVendor, getVendor, updateVendor, removeVendor, getStats } from '../controllers/vendor.js';
import { upload } from '../config/upload.js';

const router = express.Router();
router.get('/stats', authRequired, getStats);
router.get('/', authRequired, listVendors);
router.get('/:id', authRequired, getVendor);
router.post('/', upload, createVendor);

router.patch('/:id', authRequired, updateVendor);
router.delete('/:id', authRequired, removeVendor);
export default router;

