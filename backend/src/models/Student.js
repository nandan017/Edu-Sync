const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  registerNumber: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  category: String,
  fatherName: String,
  motherName: String,
  phone: { type: String, required: true, unique: true },
  address: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  semester: { type: Number, default: 1 },
  section: { type: String, default: 'A' },
  yearOfJoining: Number,
  yearOfPassing: Number,
  cgpa: { type: Number, default: 0 },
  attendance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
