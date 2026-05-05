const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, unique: true },
  fullName: { type: String, required: true, trim: true },
  designation: { type: String, default: 'Assistant Professor' },
  qualification: String,
  experience: String,
  specialization: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  phone: String,
  office: String,
  subjects: [String],
  yearHandling: [Number],
  sectionHandling: [String],
  weeklyHours: Number,
  labHours: { type: Number, default: 0 },
  theoryHours: { type: Number, default: 0 },
  isHOD: { type: Boolean, default: false },
  // Soft-delete fields
  isTerminated: { type: Boolean, default: false },
  terminatedAt: { type: Date },
  terminationReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
