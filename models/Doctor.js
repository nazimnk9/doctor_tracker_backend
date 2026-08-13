import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a doctor name'],
    trim: true,
  },
  specialization: {
    type: String,
    required: [true, 'Please provide a specialization'],
    trim: true,
  },
  hospital: {
    type: String,
    required: [true, 'Please provide a hospital name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
}, {
  timestamps: true,
});

// Adding compound indexes for text search and single indexes for optimized filtering
doctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text' });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ createdAt: -1 });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
