import mongoose from 'mongoose';

const timetableClassSchema = new mongoose.Schema(
  {
    classKey: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    start: {
      type: String,
      required: true,
      trim: true,
    },
    end: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: String,
      trim: true,
      default: 'Faculty',
    },
    venue: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    type: {
      type: String,
      enum: ['L', 'T', 'P'], // Lecture, Tutorial, Practical/Lab
      default: 'L',
    },
    batches: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Add index for fast querying by classKey and day
timetableClassSchema.index({ classKey: 1, day: 1 });

const TimetableClass = mongoose.model('TimetableClass', timetableClassSchema);

export default TimetableClass;
