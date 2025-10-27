import Agenda, { Job } from 'agenda';
import { CreateReminder } from '../types/types';
import { config } from '../config/config';
import { DB_NAME } from '../constants';
import logger from '../utils/logger';
import { generateReminderMail } from '../templates/reminder.mail';
import sendMail from '../config/nodemailer';

const agenda = new Agenda({
  db: { address: `${config.MONGODB_URI}/${DB_NAME}`, collection: 'reminderJobs' },
  processEvery: '30 seconds',
  maxConcurrency: 30,
});

agenda.define('send reminder email', async (job: Job<CreateReminder>) => {
  const { userName, userId, userEmail, characterName, characterId, message } = job.attrs.data;

  if (config.NODE_ENV === 'development') {
    logger.info(`Sending reminder email to ${userName} for ${characterName}.`);
  }

  const { subject, text, html } = generateReminderMail(userName, characterName, message);

  await sendMail(userEmail, subject, text, html);

  await agenda.cancel({
    name: 'send reminder email',
    'data.userId': userId,
    'data.characterId': characterId,
  });
});

export default agenda;
