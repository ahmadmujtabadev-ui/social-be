import express from 'express';

import participantRoutes from './participants.js';
import volunteerRoutes from './voluteers.js';
import sponserRoutes from './sponsor.js';
import userRoutes from './user.js';
import vendorRoutes from './vendor.js';     
import eventRoutes from './event.js'

const router = express.Router();
router.use('/api/v1/participants', participantRoutes);                                                              
router.use('/api/v1/user', userRoutes);
router.use('/api/v1/participants', participantRoutes);
router.use('/api/v1/sponsor', sponserRoutes);
router.use('/api/v1/vendor', vendorRoutes);
router.use('/api/v1/volunteer', volunteerRoutes);
router.use('api/v1/event', eventRoutes)

export default router;

