import { normalizedVersion } from './ai-chat.js';

// Add more tests for normalizedVersion function
describe('normalizedVersion additional tests', () => {
  test('should handle empty string', () => {
    expect(normalizedVersion('')).toBe('');
  });

  test('should handle version with leading zeros', () => {
    expect(normalizedVersion('3.02.01')).toBe('3.02.01');
  });

  test('should handle version with letters', () => {
    // The current implementation only splits by dots and takes the first 3 segments
    // It doesn't specifically handle version suffixes
    expect(normalizedVersion('3.32.1-beta')).toBe('3.32.1-beta');
  });

  test('should handle version with letters in multiple segments', () => {
    // The current implementation only splits by dots and takes the first 3 segments
    expect(normalizedVersion('3.32-rc.1.456')).toBe('3.32-rc.1');
  });

  test('should handle version with only one segment and suffix', () => {
    // The current implementation only splits by dots and takes the first 3 segments
    expect(normalizedVersion('3-beta.456.789')).toBe('3-beta.456.789');
  });
});