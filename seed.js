import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Patient from './models/Patient.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Default Admin User
    const adminUser = await User.create({
      email: 'admin@doctortracker.com',
      password: 'admin123', // Will be automatically hashed by User.js model pre-save hook
    });
    console.log(`Seeded Admin User: ${adminUser.email}`);

    // 2. Create Doctors
    const doctorsData = [
      {
        name: 'Dr. Sarah Connor',
        specialization: 'Cardiology',
        hospital: 'City General Hospital',
        phone: '+1-555-0192',
        email: 'sarah.connor@hospital.com',
      },
      {
        name: 'Dr. Robert Chen',
        specialization: 'Pediatrics',
        hospital: 'Metro Children\'s Clinic',
        phone: '+1-555-0143',
        email: 'robert.chen@hospital.com',
      },
      {
        name: 'Dr. Emily Watson',
        specialization: 'Neurology',
        hospital: 'St. Jude Medical Center',
        phone: '+1-555-0188',
        email: 'emily.watson@hospital.com',
      },
      {
        name: 'Dr. David Kim',
        specialization: 'Orthopedics',
        hospital: 'Sports Medicine Institute',
        phone: '+1-555-0177',
        email: 'david.kim@hospital.com',
      },
      {
        name: 'Dr. Lisa Ray',
        specialization: 'Dermatology',
        hospital: 'Skin & Laser Center',
        phone: '+1-555-0122',
        email: 'lisa.ray@hospital.com',
      },
    ];

    const seededDoctors = await Doctor.insertMany(doctorsData);
    console.log(`Seeded ${seededDoctors.length} Doctors.`);

    // 3. Create Patients with distributed registration dates over the past 10 days
    const patientsData = [];
    const conditions = ['Hypertension', 'Type 2 Diabetes', 'Migraine', 'Asthma', 'Flu', 'Fracture', 'Allergies', 'Anxiety'];
    const genders = ['Male', 'Female', 'Other'];
    
    const names = [
      'John Doe', 'Jane Smith', 'Alice Johnson', 'Michael Brown', 'Emily Davis', 
      'David Miller', 'Sophia Wilson', 'James Taylor', 'Olivia Anderson', 'Daniel Thomas',
      'Isabella Jackson', 'Matthew White', 'Charlotte Harris', 'Ethan Martin', 'Amelia Thompson',
      'Lucas Garcia', 'Mia Martinez', 'Henry Robinson', 'Evelyn Clark', 'Alexander Rodriguez'
    ];

    for (let i = 0; i < names.length; i++) {
      // Pick a random doctor
      const randomDoctor = seededDoctors[Math.floor(Math.random() * seededDoctors.length)];
      
      // Calculate a date in the past (0 to 9 days ago) to show daily registration trend
      const daysAgo = Math.floor(Math.random() * 10);
      const dateAdded = new Date();
      dateAdded.setDate(dateAdded.getDate() - daysAgo);

      patientsData.push({
        name: names[i],
        age: Math.floor(Math.random() * 60) + 18, // 18 to 77
        gender: genders[Math.floor(Math.random() * genders.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        phone: `+1-555-98${10 + i}`,
        email: `${names[i].toLowerCase().replace(' ', '.')}@email.com`,
        doctor: randomDoctor._id,
        dateAdded,
      });
    }

    const seededPatients = await Patient.insertMany(patientsData);
    console.log(`Seeded ${seededPatients.length} Patients.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
