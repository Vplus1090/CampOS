import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: [true, 'Notice Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    Content: {
      type: String,
      required: [true, 'Notice Content is required'],
      trim: true,
    },
    Date: {
      type: Date,
      default: Date.now,
    },
    PriorityLevel: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'Medium',
      required: [true, 'Priority level is required'],
    },
    PostedBy: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add index for fast querying by date and priority
noticeSchema.index({ Date: -1 });
noticeSchema.index({ PriorityLevel: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
