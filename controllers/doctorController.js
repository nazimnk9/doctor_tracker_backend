import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

/**
 * @desc    Get all doctors with search, filters, and pagination
 * @route   GET /api/doctors
 * @access  Private
 */
export const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Text Search (Matches name, specialization, or hospital)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
      ];
    }

    // 2. Specialized Filtering
    if (req.query.specialization) {
      query.specialization = req.query.specialization;
    }
    if (req.query.hospital) {
      query.hospital = req.query.hospital;
    }

    // 3. Date-wise Filtering (createdAt date range)
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Set time to end of day
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Run optimized paginated query
    const total = await Doctor.countDocuments(query);
    const doctors = await Doctor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get list of unique specializations and hospitals for frontend filter dropdowns
    const specializations = await Doctor.distinct('specialization');
    const hospitals = await Doctor.distinct('hospital');

    res.json({
      doctors,
      page,
      pages: Math.ceil(total / limit),
      total,
      filters: {
        specializations,
        hospitals,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Create a new doctor
 * @route   POST /api/doctors
 * @access  Private
 */
export const createDoctor = async (req, res) => {
  const { name, specialization, hospital, phone, email } = req.body;

  try {
    if (!name || !specialization || !hospital || !phone || !email) {
      return res.status(400).json({ message: 'All doctor fields are required' });
    }

    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      hospital,
      phone,
      email,
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get patients list under a specific doctor
 * @route   GET /api/doctors/:id/patients
 * @access  Private
 */
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const patients = await Patient.find({ doctor: doctorId }).sort({ dateAdded: -1 });
    res.json({ doctor, patients });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Add a patient under a specific doctor
 * @route   POST /api/doctors/:id/patients
 * @access  Private
 */
export const addPatientToDoctor = async (req, res) => {
  const doctorId = req.params.id;
  const { name, age, gender, condition, phone, email } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!name || !age || !gender || !condition || !phone) {
      return res.status(400).json({ message: 'Name, age, gender, condition, and phone are required' });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      condition,
      phone,
      email: email || '',
      doctor: doctorId,
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete a patient from a doctor's list
 * @route   DELETE /api/doctors/:id/patients/:patientId
 * @access  Private
 */
export const deletePatientFromDoctor = async (req, res) => {
  try {
    const { id, patientId } = req.params;

    const patient = await Patient.findOne({ _id: patientId, doctor: id });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found under this doctor' });
    }

    await Patient.findByIdAndDelete(patientId);
    res.json({ message: 'Patient successfully removed from doctor list' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update doctor details
 * @route   PUT /api/doctors/:id
 * @access  Private
 */
export const updateDoctor = async (req, res) => {
  const { name, specialization, hospital, phone, email } = req.body;

  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (email && email !== doctor.email) {
      const emailExists = await Doctor.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Doctor with this email already exists' });
      }
    }

    doctor.name = name || doctor.name;
    doctor.specialization = specialization || doctor.specialization;
    doctor.hospital = hospital || doctor.hospital;
    doctor.phone = phone || doctor.phone;
    doctor.email = email || doctor.email;

    const updatedDoctor = await doctor.save();
    res.json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete a doctor and their assigned patients
 * @route   DELETE /api/doctors/:id
 * @access  Private
 */
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Cascade delete: Remove all patients assigned to this doctor
    await Patient.deleteMany({ doctor: req.params.id });

    // Delete the doctor
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({ message: 'Doctor and assigned patients successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

