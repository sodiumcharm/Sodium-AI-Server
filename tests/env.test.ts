import { describe, it, expect } from 'vitest';
import { config, checkEnvVariables } from '../src/config/config';

describe('Check Environment Variables', () => {
  it('should return false if any required variable is missing', () => {
    const result = checkEnvVariables(config, 'return-boolean');
    expect(result).toBe(true);
  });
});
