const Student = require('../models/Student');

async function generateRegisterNumber(departmentCode, yearOfJoining) {
  const prefix = `${departmentCode.toUpperCase()}-${yearOfJoining}`;
  const lastStudent = await Student.findOne({ registerNumber: new RegExp(`^${prefix}-`) })
    .sort({ registerNumber: -1 })
    .lean();

  let serial = 1;
  if (lastStudent) {
    const parts = lastStudent.registerNumber.split('-');
    serial = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}-${String(serial).padStart(3, '0')}`;
}

module.exports = { generateRegisterNumber };
