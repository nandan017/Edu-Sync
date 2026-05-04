/**
 * Seed script: creates initial admin user and departments.
 * Run: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const { encrypt } = require('./services/credential.service');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user if not exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        email: 'admin@edusync.com',
        passwordHash: 'Admin@123',
        passwordPlain: encrypt('Admin@123'),
        role: 'admin',
      });
      console.log('✅ Admin user created (username: admin, password: Admin@123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create principal user if not exists
    const existingPrincipal = await User.findOne({ role: 'principal' });
    if (!existingPrincipal) {
      await User.create({
        username: 'principal',
        email: 'principal@edusync.com',
        passwordHash: 'Principal@123',
        passwordPlain: encrypt('Principal@123'),
        role: 'principal',
      });
      console.log('✅ Principal user created (username: principal, password: Principal@123)');
    } else {
      console.log('ℹ️  Principal user already exists');
    }

    // Create default departments
    const departments = [
      { name: 'BCA', fullName: 'Bachelor of Computer Applications', weeklyHoursRule: 20, labHoursRule: 12, theoryHoursRule: 8 },
      { name: 'BBA', fullName: 'Bachelor of Business Administration', weeklyHoursRule: 16, labHoursRule: 0, theoryHoursRule: 16 },
      { name: 'BCOM', fullName: 'Bachelor of Commerce', weeklyHoursRule: 16, labHoursRule: 0, theoryHoursRule: 16 },
    ];

    for (const dept of departments) {
      const exists = await Department.findOne({ name: dept.name });
      if (!exists) {
        await Department.create(dept);
        console.log(`✅ Department created: ${dept.name}`);
      } else {
        console.log(`ℹ️  Department ${dept.name} already exists`);
      }
    }

    console.log('\n🎉 Seed complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
