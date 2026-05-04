const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  title: { type: String, required: true },
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
