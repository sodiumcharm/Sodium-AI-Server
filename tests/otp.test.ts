import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import {
  randomOTPGenerator,
  randomCodeGenerator,
  allChars,
  createAndSendOTP,
  verifyOTP,
  generateSecretCode,
} from '../src/controllers/otp/otp.utils';
import { TEST_USER_EMAIL, TEST_FULLNAME, TEST_USER_ID } from '../src/constants';
import { UserDocument } from '../src/types/types';
import OTP from '../src/models/otp.model';

describe('randomOTPGenerator', () => {
  const otp = randomOTPGenerator();

  it('should return a string', () => {
    expect(typeof otp).toBe('string');
  });

  it('should return a 6-digit string', () => {
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should return different values on multiple calls', () => {
    const otp1 = randomOTPGenerator();
    const otp2 = randomOTPGenerator();
    expect(otp1).not.toBe(otp2);
  });
});

describe('randomCodeGenerator', () => {
  const code = randomCodeGenerator(allChars);

  it('should return a string', () => {
    expect(typeof code).toBe('string');
  });

  it('should return a string of length 15', () => {
    expect(code).toHaveLength(15);
  });

  it('should only contain letters and numbers', () => {
    expect(/^[a-zA-Z0-9]{15}$/.test(code)).toBe(true);
  });

  it('should return different codes on multiple calls', () => {
    const code1 = randomCodeGenerator(allChars);
    const code2 = randomCodeGenerator(allChars);
    expect(code1).not.toBe(code2);
  });
});

describe('createAndSendOTP', () => {
  it('should successfully create and send OTP through mail', async () => {
    const testUser = {
      _id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      fullname: TEST_FULLNAME,
    } as unknown as UserDocument;

    const result = await createAndSendOTP(testUser, 'verify-email');

    expect(result).toBe(true);
  });
});

describe('verifyOTP', () => {
  const correctOtp = '545865';
  const wrongOtp = '123456';

  beforeEach(async () => {
    const hashedOTP = await bcrypt.hash(correctOtp, 10);
    await OTP.create({ userId: TEST_USER_ID, otp: hashedOTP, context: '2FA' });
  });

  it('should return success object for a correct OTP', async () => {
    const result = await verifyOTP(TEST_USER_ID, correctOtp, '2FA');

    expect(result).toEqual({
      statusCode: 200,
      success: true,
      message: 'OTP verification successful.',
    });
  });

  it('should return an incorrect OTP object for a wrong OTP', async () => {
    const result = await verifyOTP(TEST_USER_ID, wrongOtp, '2FA');

    expect(result).toEqual({
      statusCode: 400,
      success: false,
      message: 'Incorrect OTP! Try again.',
    });
  });

  it('should not allow more than 5 attempts with wrong OTP', async () => {
    for (let i = 0; i < 5; i++) {
      await verifyOTP(TEST_USER_ID, wrongOtp, '2FA');
    }

    const sixthAttemptResult = await verifyOTP(TEST_USER_ID, wrongOtp, '2FA');

    expect(sixthAttemptResult).toEqual({
      statusCode: 400,
      success: false,
      message: 'Too many failed attempts! Please request a new OTP.',
    });
  });

  it('should return an invalid OTP object in case of context for which OTP was not created', async () => {
    const result = await verifyOTP(TEST_USER_ID, correctOtp, 'verify-email');

    expect(result).toEqual({
      statusCode: 400,
      success: false,
      message: 'Invalid or expired OTP! Please request a new OTP.',
    });
  });
});

describe('generateSecretCode', () => {
  it('should return a string of length 15 containing only letters and numbers', async () => {
    const secretCode = await generateSecretCode(TEST_USER_ID);
    expect(secretCode).toHaveLength(15);
    expect(/^[a-zA-Z0-9]{15}$/.test(secretCode as string)).toBe(true);
  });
});
