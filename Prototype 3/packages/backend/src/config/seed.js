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

    // Seed default demo student account (generic test account, no real college credentials)
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
          enrollmentId: 'DEMO-0001',
          grade: '1st Year',
          branch: 'Computer Science',
          section: 'A',
          hostel: 'Hostel Block D',
          roomNumber: '404',
        }
      });

      console.log('\n' + '═'.repeat(60));
      console.log('🔐 DEFAULT DEMO STUDENT ACCOUNT CREATED');
      console.log('═'.repeat(60));
      console.log(`   Email:    student@campos.local`);
      console.log(`   Password: Student@123`);
      console.log(`   Role:     student (demo — no JPortal link)`);
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('🎓 Demo student account already exists. Skipping seed.');
    }

    // Seed Vardaan's student account (linked to real JIIT enrollment)
    const vardaanExists = await User.findOne({ $or: [{ email: 'vardaan@campos.local' }, { email: '2501200031@campos.local' }] });
    if (!vardaanExists) {
      await User.create({
        email: '2501200031@campos.local',
        password: 'kyamujheKrishsepyaarhai?',
        role: 'student',
        firstName: 'Vardaan',
        lastName: 'Gahlot',
        mustChangePassword: false,
        isEmailVerified: true,
        studentProfile: {
          enrollmentId: '2501200031',
          grade: '1st Year',
          branch: 'Computer Science & Engineering',
          section: 'A',
          hostel: 'Hostel Block D',
          roomNumber: '404',
        }
      });

      console.log('\n' + '═'.repeat(60));
      console.log('🔐 VARDAAN STUDENT ACCOUNT CREATED');
      console.log('═'.repeat(60));
      console.log(`   Email:    2501200031@campos.local`);
      console.log(`   Password: kyamujheKrishsepyaarhai?`);
      console.log(`   Role:     student`);
      console.log(`   Enroll:   2501200031`);
      console.log('═'.repeat(60) + '\n');
    } else {
      if (vardaanExists.email === 'vardaan@campos.local') {
        vardaanExists.email = '2501200031@campos.local';
        await vardaanExists.save();
        console.log('🔄 Updated Vardaan student account email to 2501200031@campos.local');
      } else {
        console.log('🎓 Vardaan student account already exists. Skipping seed.');
      }
    }
  } catch (err) {
    console.error('❌ Failed to seed admin/student accounts:', err.message);
  }
};

export default seedAdmin;
