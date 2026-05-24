import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    MenuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Menu Item ID is required'],
    },
    Name: {
      type: String,
      required: [true, 'Item name at order-time is required'],
      trim: true,
    },
    Price: {
      type: Number,
      required: [true, 'Item price at order-time is required'],
      min: 0,
    },
    Quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    StudentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
    },
    StudentName: {
      type: String,
      trim: true,
    },
    ItemsArray: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Order must contain at least one menu item',
      },
    },
    TotalAmount: {
      type: Number,
      required: [true, 'Total Amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    OrderStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Pending',
      required: [true, 'Order Status is required'],
    },
    PickupPIN: {
      type: Number,
    },
    Timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index orders by StudentId and Timestamp
orderSchema.index({ StudentId: 1 });
orderSchema.index({ Timestamp: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
