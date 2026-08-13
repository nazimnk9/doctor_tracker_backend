import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a patient name'],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, 'Please provide patient age'],
    min: [0, 'Age cannot be negative'],
  },
  gender: {
    type: String,
    required: [true, 'Please provide patient gender'],
    enum: ['Male', 'Female', 'Other'],
  },
  condition: {
    type: String,
    required: [true, 'Please provide patient health condition'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a contact phone number'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Please assign this patient to a doctor'],
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Optimization: Indexes for querying, sorting, and filtering
patientSchema.index({ name: 'text', condition: 'text' });
patientSchema.index({ doctor: 1 });
patientSchema.index({ condition: 1 });
patientSchema.index({ dateAdded: -1 });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
