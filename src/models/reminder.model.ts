import mongoose from 'mongoose';
import { ReminderDocument } from '../types/types';

const reminderSchema = new mongoose.Schema<ReminderDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
      index: true,
    },
    reminderTime: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Reminder = mongoose.model<ReminderDocument>('Reminder', reminderSchema);

export default Reminder;
