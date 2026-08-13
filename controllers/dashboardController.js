import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

/**
 * @desc    Get dashboard metrics and analytics charts data
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total counts
    const totalDoctors = await Doctor.countDocuments({});
    const totalPatients = await Patient.countDocuments({});

    // 2. Patients per doctor aggregation (including doctors with 0 patients)
    const patientsPerDoctor = await Doctor.aggregate([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctor',
          as: 'patientsList',
        },
      },
      {
        $project: {
          name: 1,
          specialization: 1,
          count: { $size: '$patientsList' },
        },
      },
      { $sort: { count: -1, name: 1 } },
    ]);

    // 3. Date-based registration trends (admissions per day for the last 30 days)
    const dateBasedStats = await Patient.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateAdded' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // Format date-based stats for charts
    const admissionsTrend = dateBasedStats.map(item => ({
      date: item._id,
      patients: item.count,
    }));

    // 4. Specialization distribution (for analytics representation)
    const specializationStats = await Doctor.aggregate([
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const specializationDistribution = specializationStats.map(item => ({
      specialization: item._id,
      doctors: item.count,
    }));

    res.json({
      summary: {
        totalDoctors,
        totalPatients,
      },
      patientsPerDoctor,
      admissionsTrend,
      specializationDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
