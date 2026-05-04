const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, uppercase: true, trim: true },
  fullName: { type: String, required: true },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  weeklyHoursRule: { type: Number, default: 16 },
  labHoursRule: { type: Number, default: 0 },
  theoryHoursRule: { type: Number, default: 16 },
  totalStudents: { type: Number, default: 0 },
  totalFaculty: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
