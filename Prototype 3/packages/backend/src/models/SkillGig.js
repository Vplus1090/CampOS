import mongoose from 'mongoose';

const skillGigSchema = new mongoose.Schema(
  {
    StudentName: {
      type: String,
      required: [true, 'Student Name is required'],
      trim: true,
    },
    SkillOffered: {
      type: String,
      required: [true, 'Skill offered is required'],
      trim: true,
    },
    SkillWanted: {
      type: String,
      required: [true, 'Skill wanted is required'],
      trim: true,
    },
    Status: {
      type: String,
      enum: {
        values: ['Active', 'Completed', 'Closed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
      required: [true, 'Status is required'],
    },
    ContactInfo: {
      type: String,
      required: [true, 'Contact information is required'],
      trim: true,
    },
    IsReported: {
      type: Boolean,
      default: false,
    },
    ReportReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add index for searching/filtering by offered and wanted skills
skillGigSchema.index({ SkillOffered: 'text', SkillWanted: 'text', StudentName: 'text' });
skillGigSchema.index({ Status: 1 });

const SkillGig = mongoose.model('SkillGig', skillGigSchema);

export default SkillGig;
