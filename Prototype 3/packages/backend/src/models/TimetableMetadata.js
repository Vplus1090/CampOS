import mongoose from 'mongoose';

const timetableMetadataSchema = new mongoose.Schema(
  {
    semesters: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    phases: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    batches: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TimetableMetadata = mongoose.model('TimetableMetadata', timetableMetadataSchema);

export default TimetableMetadata;
