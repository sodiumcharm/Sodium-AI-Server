import { describe, it, expect } from 'vitest';
import { randomOTPGenerator } from '../src/controllers/otp/otp.utils';

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
