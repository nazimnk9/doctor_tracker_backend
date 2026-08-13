import express from 'express';
import {
  getPatients,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All patient routes require auth

router.route('/')
  .get(getPatients);

router.route('/:id')
  .put(updatePatient)
  .delete(deletePatient);

export default router;
