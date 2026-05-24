import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: [true, 'Item Name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
    },
    Price: {
      type: Number,
      required: [true, 'Item Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    Category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    IsAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index category and Name for rapid lookups
menuItemSchema.index({ Category: 1 });
menuItemSchema.index({ IsAvailable: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
