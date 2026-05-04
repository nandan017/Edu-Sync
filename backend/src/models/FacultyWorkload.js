const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  serialNumber: Number,
  teacherName: String,
  department: String,
  subjects: [String],
  yearHandling: Number,
  section: String,
  weeklyHours: Number,
}, { _id: false });

const facultyWorkloadSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  fileUrl: String,
  department: String,
  records: [recordSchema],
  status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  generatedTimetableIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' }],
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('FacultyWorkload', facultyWorkloadSchema);
