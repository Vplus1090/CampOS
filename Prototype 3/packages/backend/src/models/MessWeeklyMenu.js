import mongoose from 'mongoose';

const messWeeklyMenuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    breakfast: {
      type: String,
      required: true,
      trim: true,
    },
    lunch: {
      type: String,
      required: true,
      trim: true,
    },
    dinner: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const MessWeeklyMenu = mongoose.model('MessWeeklyMenu', messWeeklyMenuSchema);

export default MessWeeklyMenu;
