import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

/**
 * @desc    Get all patients with search, filters, and pagination
 * @route   GET /api/patients
 * @access  Private
 */
export const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Search (matches name or condition)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { condition: searchRegex },
      ];
    }

    // 2. Filters
    if (req.query.condition) {
      query.condition = req.query.condition;
    }
    if (req.query.gender) {
      query.gender = req.query.gender;
    }
    if (req.query.doctorId) {
      query.doctor = req.query.doctorId;
    }

    // 3. Date-wise filtering (dateAdded range)
    if (req.query.startDate || req.query.endDate) {
      query.dateAdded = {};
      if (req.query.startDate) {
        query.dateAdded.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.dateAdded.$lte = end;
      }
    }

    // Perform query populating the associated Doctor's info
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('doctor', 'name specialization hospital')
      .sort({ dateAdded: -1 })
      .skip(skip)
      .limit(limit);

    // Get list of unique conditions and doctors for frontend filters
    const conditions = await Patient.distinct('condition');
    const doctorsList = await Doctor.find({}, 'name');

    res.json({
      patients,
      page,
      pages: Math.ceil(total / limit),
      total,
      filters: {
        conditions,
        doctors: doctorsList,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update patient information
 * @route   PUT /api/patients/:id
 * @access  Private
 */
export const updatePatient = async (req, res) => {
  const { name, age, gender, condition, phone, email, doctor } = req.body;

  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Validate doctor exists if we are changing it
    if (doctor && doctor !== patient.doctor.toString()) {
      const docExists = await Doctor.findById(doctor);
      if (!docExists) {
        return res.status(400).json({ message: 'Assigned doctor not found' });
      }
    }

    // Update fields
    patient.name = name || patient.name;
    patient.age = age !== undefined ? age : patient.age;
    patient.gender = gender || patient.gender;
    patient.condition = condition || patient.condition;
    patient.phone = phone || patient.phone;
    patient.email = email !== undefined ? email : patient.email;
    patient.doctor = doctor || patient.doctor;

    const updatedPatient = await patient.save();
    
    // Return populated doctor details
    const populated = await Patient.findById(updatedPatient._id).populate('doctor', 'name specialization hospital');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete a patient
 * @route   DELETE /api/patients/:id
 * @access  Private
 */
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
