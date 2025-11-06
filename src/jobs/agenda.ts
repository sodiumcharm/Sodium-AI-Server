import Agenda, { Job } from 'agenda';
import { CreateReminder, ScheduleNotification } from '../types/types';
import { config } from '../config/config';
import { DB_NAME } from '../constants';
import logger from '../utils/logger';
import { generateReminderMail } from '../templates/reminder.mail';
import sendMail from '../config/nodemailer';
import createScheduledNotification from '../notification/scheduledNotification';

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

agenda.define('scheduled notification', async (job: Job<ScheduleNotification>) => {
  const { text, image } = job.attrs.data;

  if (config.NODE_ENV === 'development') {
    logger.info(`Sending scheduled notification to all User: "${text}".`);
  }

  await createScheduledNotification(text, image);

  await agenda.cancel({
    name: 'scheduled notification',
    'data.text': text,
    'data.image': image,
  });
});

export default agenda;
