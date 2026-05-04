const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: Number,
  credits: Number,
  type: { type: String, enum: ['theory', 'lab', 'both'], default: 'theory' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
