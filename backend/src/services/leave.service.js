const Timetable = require('../models/Timetable');
const LeaveRequest = require('../models/LeaveRequest');

// When a leave is approved, mark affected timetable slots as on-leave
async function applyLeaveToTimetable(leaveRequest, facultyDoc) {
  if (leaveRequest.status !== 'approved' || !facultyDoc) return;

  const startDate = new Date(leaveRequest.startDate);
  const endDate = new Date(leaveRequest.endDate);

  // Get days of the week that fall in the leave range
  const leaveDays = [];
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dayName = dayNames[current.getDay()];
    if (dayName !== 'Sunday' && !leaveDays.includes(dayName)) {
      leaveDays.push(dayName);
    }
    current.setDate(current.getDate() + 1);
  }

  // Find timetables that have this faculty and update matching slots
  const timetables = await Timetable.find({
    'slots.facultyId': facultyDoc._id,
    'slots.day': { $in: leaveDays },
  });

  const affectedSlotIds = [];

  for (const tt of timetables) {
    let modified = false;
    for (const slot of tt.slots) {
      if (
        slot.facultyId?.toString() === facultyDoc._id.toString() &&
        leaveDays.includes(slot.day)
      ) {
        slot.isOnLeave = true;
        slot.leaveId = leaveRequest._id;
        affectedSlotIds.push(slot._id);
        modified = true;
      }
    }
    if (modified) await tt.save();
  }

  // Update leave request with affected slot IDs
  leaveRequest.timetableSlotsAffected = affectedSlotIds;
  await leaveRequest.save();

  return affectedSlotIds;
}

// Remove leave markings if leave is rejected/cancelled
async function removeLeaveFromTimetable(leaveId) {
  const timetables = await Timetable.find({ 'slots.leaveId': leaveId });
  for (const tt of timetables) {
    let modified = false;
    for (const slot of tt.slots) {
      if (slot.leaveId?.toString() === leaveId.toString()) {
        slot.isOnLeave = false;
        slot.leaveId = null;
        modified = true;
      }
    }
    if (modified) await tt.save();
  }
}

module.exports = { applyLeaveToTimetable, removeLeaveFromTimetable };
