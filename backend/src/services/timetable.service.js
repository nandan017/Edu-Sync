const ExcelJS = require('exceljs');
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');
const Timetable = require('../models/Timetable');
const FacultyWorkload = require('../models/FacultyWorkload');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

// Period timings (8 periods per day)
const PERIOD_TIMINGS = [
  { period: 1, timeStart: '09:00', timeEnd: '10:00' },
  { period: 2, timeStart: '10:00', timeEnd: '11:00' },
  { period: 3, timeStart: '11:15', timeEnd: '12:15' },
  { period: 4, timeStart: '12:15', timeEnd: '13:15' },
  { period: 5, timeStart: '14:00', timeEnd: '15:00' },
  { period: 6, timeStart: '15:00', timeEnd: '16:00' },
  { period: 7, timeStart: '16:15', timeEnd: '17:15' },
  { period: 8, timeStart: '17:15', timeEnd: '18:15' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Parse faculty workload CSV/Excel file
 * Expected columns: Serial No, Teacher Name, Department, Subjects, Year, Section, Weekly Hours
 */
async function parseWorkloadFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const records = [];

  if (ext === '.csv') {
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', row => records.push(normalizeWorkloadRow(row)))
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    const headers = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, col) => { headers[col] = String(cell.value).trim().toLowerCase(); });
      } else {
        const obj = {};
        row.eachCell((cell, col) => { if (headers[col]) obj[headers[col]] = String(cell.value || '').trim(); });
        records.push(normalizeWorkloadRow(obj));
      }
    });
    return records;
  }

  throw new Error('Unsupported file format');
}

function normalizeWorkloadRow(row) {
  const subjects = (row['subjects'] || row['subjects taken'] || row['subjects handled'] || '')
    .split(/[,;]/).map(s => s.trim()).filter(Boolean);

  return {
    serialNumber: parseInt(row['serial no'] || row['s.no'] || row['sno'] || row['serial number'] || '0'),
    teacherName: row['teacher name'] || row['name'] || row['faculty name'] || '',
    department: (row['department'] || row['dept'] || '').toUpperCase(),
    subjects,
    yearHandling: parseInt(row['year'] || row['year handling'] || '1'),
    section: (row['section'] || 'A').toUpperCase(),
    weeklyHours: parseInt(row['weekly hours'] || row['weekly working hours'] || '0'),
  };
}

/**
 * Auto-generate timetables from parsed workload records.
 * Groups records by (department, year, section) → creates one timetable per group.
 */
async function generateTimetables(workloadDoc, userId) {
  const records = workloadDoc.records;
  const generatedIds = [];

  // Group records by department + year + section
  const groups = {};
  for (const rec of records) {
    const key = `${rec.department}-${rec.yearHandling}-${rec.section}`;
    if (!groups[key]) groups[key] = { department: rec.department, year: rec.yearHandling, section: rec.section, teachers: [] };
    groups[key].teachers.push(rec);
  }

  // Track faculty assignments globally to avoid double-booking
  // key: "facultyName-day-period", value: true
  const globalAssignments = {};

  for (const key of Object.keys(groups)) {
    const group = groups[key];

    // Find or create department
    let dept = await Department.findOne({ name: group.department });
    if (!dept) {
      const isBCA = group.department === 'BCA';
      dept = await Department.create({
        name: group.department,
        fullName: group.department,
        weeklyHoursRule: isBCA ? 20 : 16,
        labHoursRule: isBCA ? 12 : 0,
        theoryHoursRule: isBCA ? 8 : 16,
      });
    }

    const isBCA = group.department === 'BCA';
    const slots = [];

    // Build a pool of available (day, period) combos
    const availableSlots = [];
    for (const day of DAYS) {
      for (const pt of PERIOD_TIMINGS) {
        availableSlots.push({ day, ...pt });
      }
    }

    let slotIndex = 0;

    for (const teacher of group.teachers) {
      // Look up faculty doc if exists
      const facultyDoc = await Faculty.findOne({
        fullName: { $regex: new RegExp(teacher.teacherName, 'i') },
        departmentId: dept._id,
      });

      let theoryHoursNeeded, labHoursNeeded;
      if (isBCA) {
        // BCA: 20 hrs total → 12 lab + 8 theory
        labHoursNeeded = Math.min(12, teacher.weeklyHours > 8 ? teacher.weeklyHours - 8 : 0);
        theoryHoursNeeded = teacher.weeklyHours - labHoursNeeded;
      } else {
        // Commerce depts: all theory
        theoryHoursNeeded = teacher.weeklyHours || dept.weeklyHoursRule;
        labHoursNeeded = 0;
      }

      // Distribute theory hours
      let theoryAssigned = 0;
      for (const subject of teacher.subjects) {
        if (theoryAssigned >= theoryHoursNeeded) break;

        // Spread across the week
        const hoursPerSubject = Math.ceil(theoryHoursNeeded / teacher.subjects.length);
        let subjectAssigned = 0;
        let consecutiveCount = 0;

        for (let si = slotIndex; si < availableSlots.length && subjectAssigned < hoursPerSubject; si++) {
          const s = availableSlots[si];
          const assignKey = `${teacher.teacherName}-${s.day}-${s.period}`;

          if (globalAssignments[assignKey]) continue;
          // Max 2 consecutive same-subject
          if (consecutiveCount >= 2) { consecutiveCount = 0; continue; }

          slots.push({
            day: s.day,
            period: s.period,
            timeStart: s.timeStart,
            timeEnd: s.timeEnd,
            subject,
            facultyId: facultyDoc?._id || null,
            facultyName: teacher.teacherName,
            room: `${group.department}-${group.year}${group.section}`,
            type: 'theory',
            isOnLeave: false,
          });

          globalAssignments[assignKey] = true;
          subjectAssigned++;
          theoryAssigned++;
          consecutiveCount++;
        }
      }

      // Distribute lab hours (consecutive 2-hr blocks) for BCA
      if (labHoursNeeded > 0) {
        let labAssigned = 0;
        const labSubjects = teacher.subjects.filter(s => s.toLowerCase().includes('lab') || s.toLowerCase().includes('practical'));
        const labSubject = labSubjects.length > 0 ? labSubjects[0] : `${teacher.subjects[0]} Lab`;

        for (let di = 0; di < DAYS.length && labAssigned < labHoursNeeded; di++) {
          const day = DAYS[di];
          // Find consecutive free periods on this day
          for (let pi = 0; pi < PERIOD_TIMINGS.length - 1 && labAssigned < labHoursNeeded; pi++) {
            const p1 = PERIOD_TIMINGS[pi];
            const p2 = PERIOD_TIMINGS[pi + 1];
            const key1 = `${teacher.teacherName}-${day}-${p1.period}`;
            const key2 = `${teacher.teacherName}-${day}-${p2.period}`;

            if (globalAssignments[key1] || globalAssignments[key2]) continue;

            // Assign 2-hour lab block
            for (const p of [p1, p2]) {
              slots.push({
                day,
                period: p.period,
                timeStart: p.timeStart,
                timeEnd: p.timeEnd,
                subject: labSubject,
                facultyId: facultyDoc?._id || null,
                facultyName: teacher.teacherName,
                room: `${group.department}-LAB`,
                type: 'lab',
                isOnLeave: false,
              });
              globalAssignments[`${teacher.teacherName}-${day}-${p.period}`] = true;
              labAssigned++;
            }
          }
        }
      }

      slotIndex += theoryAssigned;
    }

    // Remove any existing timetable for this combo
    await Timetable.deleteMany({
      departmentId: dept._id,
      year: group.year,
      section: group.section,
      type: 'academic',
    });

    // Create timetable
    const timetable = await Timetable.create({
      departmentId: dept._id,
      department: group.department,
      type: 'academic',
      year: group.year,
      section: group.section,
      slots,
      isPublished: true,
      generatedFrom: workloadDoc._id,
      createdBy: userId,
    });

    generatedIds.push(timetable._id);
  }

  // Update workload doc
  workloadDoc.status = 'processed';
  workloadDoc.generatedTimetableIds = generatedIds;
  await workloadDoc.save();

  return generatedIds;
}

module.exports = { parseWorkloadFile, generateTimetables };
