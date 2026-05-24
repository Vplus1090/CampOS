import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    SenderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    ReceiverName: {
      type: String,
      required: [true, 'Receiver name is required'],
      trim: true,
    },
    Content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
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

// Index sender and receiver for high performance chat lookup query aggregates
messageSchema.index({ SenderName: 1, ReceiverName: 1 });
messageSchema.index({ Timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
