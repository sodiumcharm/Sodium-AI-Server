import bcrypt from 'bcrypt';
import OTP from '../../models/otp.model';
import sendMail from '../../config/nodemailer';
import generateOTPMail from '../../templates/otp.mail';
import { SuccessResult, UserDocument } from '../../types/types';

const randomOTPGenerator = function (): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createAndSendOTP = async function (
  user: UserDocument,
  context: '2FA' | 'verify-email' | 'forgot-password'
): Promise<boolean> {
  try {
    const userId = user._id;
    const userName = user.fullname;
    const email = user.email;

    const otp = randomOTPGenerator();

    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.deleteMany({ userId, context });

    const otpDocument = await OTP.create({ userId, otp: hashedOTP, context });

    if (!otpDocument) return false;

    const { subject, text, html } = generateOTPMail(userName, otp, context);

    const isMailSent = await sendMail(email, subject, text, html);

    if (!isMailSent) return false;

    return true;
  } catch (error) {
    return false;
  }
};

export const verifyOTP = async function (
  userId: string,
  otp: string,
  context: '2FA' | 'verify-email' | 'forgot-password'
): Promise<SuccessResult> {
  try {
    const otpDocument = await OTP.findOne({ userId, context });

    if (!otpDocument)
      return {
        statusCode: 400,
        success: false,
        message: 'Invalid or expired OTP! Please request a new OTP.',
      };

    if (otpDocument.attempts >= 5)
      return {
        statusCode: 400,
        success: false,
        message: 'Too many failed attempts! Please request a new OTP.',
      };

    const isMatching = await bcrypt.compare(otp, otpDocument.otp);

    if (!isMatching) {
      await OTP.findByIdAndUpdate(otpDocument._id, { $inc: { attempts: 1 } });
      return {
        statusCode: 400,
        success: false,
        message: 'Incorrect OTP! Try again.',
      };
    }

    const expiryTime = new Date(otpDocument.createdAt).getTime() + 5 * 60 * 1000;

    const now = Date.now();

    if (now > expiryTime)
      return {
        statusCode: 400,
        success: false,
        message: 'OTP has expired! Please request a new OTP.',
      };

    return {
      statusCode: 200,
      success: true,
      message: 'OTP verification successful.',
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: 'Failed to verify OTP! Please try again.',
    };
  }
};
