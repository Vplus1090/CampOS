import mongoose from 'mongoose';
import connectDB, { disconnectDB } from './db.js';
import User from '../models/User.js';
import SkillGig from '../models/SkillGig.js';

async function updateDb() {
  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB...');

    // 1. Update Student User first name
    const studentUser = await User.findOne({ email: 'student@campos.local' });
    if (studentUser) {
      studentUser.firstName = 'Student';
      await studentUser.save();
      console.log('✅ Updated student user first name to "Student".');
    } else {
      console.log('ℹ️ Student user not found.');
    }

    // 2. Update SkillGigs
    const result = await SkillGig.updateMany(
      { StudentName: 'Dhruv' },
      { 
        $set: { 
          StudentName: 'Student',
          ContactInfo: 'student.ml@campos.edu | Slack: #student-ml'
        } 
      }
    );
    console.log(`✅ Updated ${result.modifiedCount} SkillGigs from Dhruv to Student.`);

    console.log('🎉 Database update complete.');
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    await disconnectDB();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

updateDb();
