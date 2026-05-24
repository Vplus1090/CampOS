import User from '../models/User.js';

/**
 * Seed the default admin account on first startup.
 * Only creates the admin if no admin user exists in the database.
 */
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    const canteenAdminExists = await User.findOne({ role: 'canteen_admin' });

    if (!adminExists) {
      await User.create({
        email: 'admin@campos.local',
        password: 'CampOS@Admin123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        mustChangePassword: true,
        isEmailVerified: true,
      });

      console.log('\n' + '═'.repeat(60));
      console.log('🔐 DEFAULT SUPER ADMIN ACCOUNT CREATED');
      console.log('═'.repeat(60));
      console.log(`   Email:    admin@campos.local`);
      console.log(`   Password: CampOS@Admin123`);
      console.log(`   Role:     admin`);
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('👤 Super Admin account already exists. Skipping seed.');
    }

    if (!canteenAdminExists) {
      await User.create({
        email: 'canteen@campos.local',
        password: 'Canteen@123',
        role: 'canteen_admin',
        firstName: 'Canteen',
        lastName: 'Counter',
        mustChangePassword: false,
        isEmailVerified: true,
      });

      console.log('\n' + '═'.repeat(60));
      console.log('🔐 DEFAULT CANTEEN COUNTER ADMIN ACCOUNT CREATED');
      console.log('═'.repeat(60));
      console.log(`   Email:    canteen@campos.local`);
      console.log(`   Password: Canteen@123`);
      console.log(`   Role:     canteen_admin`);
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('🍔 Canteen Counter Admin account already exists. Skipping seed.');
    }

    // Seed default student account
    const studentExists = await User.findOne({ email: 'student@campos.local' });
    if (!studentExists) {
      await User.create({
        email: 'student@campos.local',
        password: 'Student@123',
        role: 'student',
        firstName: 'Dhruv',
        lastName: 'Gahlot',
        mustChangePassword: false,
        isEmailVerified: true,
        studentProfile: {
          enrollmentId: 'ST-2026-99',
          grade: '1st Year',
          branch: 'Computer Science',
          section: 'A',
          hostel: 'Hostel Block D',
          roomNumber: '404',
        }
      });

      console.log('\n' + '═'.repeat(60));
      console.log('🔐 DEFAULT STUDENT ACCOUNT CREATED');
      console.log('═'.repeat(60));
      console.log(`   Email:    student@campos.local`);
      console.log(`   Password: Student@123`);
      console.log(`   Role:     student`);
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('🎓 Student test account already exists. Skipping seed.');
    }
  } catch (err) {
    console.error('❌ Failed to seed admin/student accounts:', err.message);
  }
};

export default seedAdmin;
