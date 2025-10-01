import nodemailer, { SentMessageInfo } from 'nodemailer';
import { SERVICE_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_SECURE } from '../constants';
import { config } from '../config/config';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SERVICE_EMAIL,
    pass: config.GOOGLE_APP_PASSWORD,
  },
});

const sendMail = async function (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<SentMessageInfo | null> {
  try {
    const info = await transporter.sendMail({
      from: `"Sodium AI" <${SERVICE_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    return info;
  } catch (error) {
    if (config.NODE_ENV === 'development') {
      logger.error({ mailError: error }, 'Error while sending mail!');
    }
    return null;
  }
};

export default sendMail;
