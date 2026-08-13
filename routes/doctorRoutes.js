import express from 'express';
import {
  getDoctors,
  createDoctor,
  getDoctorPatients,
  addPatientToDoctor,
  deletePatientFromDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes under doctors require auth

router.route('/')
  .get(getDoctors)
  .post(createDoctor);

router.route('/:id')
  .put(updateDoctor)
  .delete(deleteDoctor);

router.route('/:id/patients')
  .get(getDoctorPatients)
  .post(addPatientToDoctor);

router.route('/:id/patients/:patientId')
  .delete(deletePatientFromDoctor);


export default router;
