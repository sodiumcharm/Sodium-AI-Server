import { describe, it, expect } from 'vitest';
import {
  randomOTPGenerator,
  randomCodeGenerator,
  allChars,
} from '../src/controllers/otp/otp.utils';

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
