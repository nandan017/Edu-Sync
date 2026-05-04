const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: { type: String, required: true, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] },
  period: { type: Number, required: true, min: 1, max: 8 },
  timeStart: String,
  timeEnd: String,
  subject: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  facultyName: String,
  room: String,
  type: { type: String, enum: ['theory', 'lab', 'free'], default: 'theory' },
  isOnLeave: { type: Boolean, default: false },
  leaveId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
}, { _id: true });

const timetableSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  department: String,
  type: { type: String, enum: ['academic', 'exam'], default: 'academic' },
  year: Number,
  section: { type: String, default: 'A' },
  semester: Number,
  slots: [slotSchema],
  isPublished: { type: Boolean, default: false },
  generatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'FacultyWorkload' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

timetableSchema.index({ departmentId: 1, year: 1, section: 1, type: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
