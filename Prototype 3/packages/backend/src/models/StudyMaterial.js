import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    driveLink: {
      type: String,
      required: [true, 'Drive link is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'Notes',
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      default: 'General'
    },
    code: {
      type: String,
      trim: true,
      default: 'GEN-101'
    },
    size: {
      type: String,
      trim: true,
      default: '1.2 MB'
    }
  },
  {
    timestamps: true,
  }
);

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

export default StudyMaterial;
