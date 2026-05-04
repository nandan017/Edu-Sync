const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterRole: { type: String, enum: ['faculty', 'hod'], required: true },
  requesterName: String,
  department: String,
  leaveType: { type: String, default: 'Casual' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approverRole: { type: String, enum: ['hod', 'principal'] },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  timetableSlotsAffected: [{ type: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
