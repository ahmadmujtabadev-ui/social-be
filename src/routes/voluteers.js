// src/routes/volunteers.js
import express from 'express';
import {
  createVolunteer,

} from '../controllers/volunteers.js';

const router = express.Router();

router.post('/', createVolunteer);


export default router;  // <-- important
