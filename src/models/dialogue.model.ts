import mongoose from 'mongoose';
import { DialogueDocument } from '../types/types';

const dialogueSchema = new mongoose.Schema<DialogueDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dialogueName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    description: {
      type: String,
      maxlength: 200,
      required: true,
      trim: true,
    },
    dialogues: [
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
      },
    ],
  },
  { timestamps: true }
);

const Dialogue = mongoose.model<DialogueDocument>('Dialogue', dialogueSchema);

export default Dialogue;
