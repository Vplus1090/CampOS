import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Event date is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    desc: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    theme: {
      type: String,
      enum: ['teal', 'rose', 'amber', 'magenta', 'purple'],
      default: 'teal',
    },
  },
  {
    timestamps: true,
  }
);

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

export default CalendarEvent;
