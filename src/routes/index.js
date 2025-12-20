import express from 'express';

import boothRoutes from './booth.js';
import participantRoutes from './participants.js';
import volunteerRoutes from './voluteers.js';
import sponserRoutes from './sponsor.js';
import userRoutes from './user.js';
import vendorRoutes from './vendor.js';     

const router = express.Router();
router.use('/api/v1/participants', participantRoutes);                                                              
router.use('/api/v1/user', userRoutes);
router.use('/api/v1/booth', boothRoutes);
router.use('/api/v1/participants', participantRoutes);
router.use('/api/v1/sponsor', sponserRoutes);
router.use('/api/v1/vendor', vendorRoutes);
router.use('/api/v1/volunteers', volunteerRoutes);

export default router;
