import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
    },
    messages: [
      {
        sender: {
          type: String,
          required: true,
          enum: ['user', 'character'],
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contextMemory: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  { timestamps: true }
);

const Memory = mongoose.model('Memory', memorySchema);

export default Memory;
