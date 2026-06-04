import mongoose from 'mongoose';

const messDailyMenuSchema = new mongoose.Schema(
  {
    mealId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    items: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

const MessDailyMenu = mongoose.model('MessDailyMenu', messDailyMenuSchema);

export default MessDailyMenu;
