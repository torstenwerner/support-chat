// This test file focuses on enhancing test coverage for the ai-chat.js module
// by adding tests for functions that aren't fully covered yet

import { removeUtmSource } from './ai-chat.js';

describe('removeUtmSource edge cases', () => {
  test('should handle URLs with query parameters containing equals signs in values', () => {
    const input = 'https://example.com?utm_source=openai&complex=value=with=equals';
    const expected = 'https://example.com?complex=value%3Dwith%3Dequals';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with empty parameter values', () => {
    const input = 'https://example.com?utm_source=openai&empty=';
    const expected = 'https://example.com?empty=';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with duplicate parameter names', () => {
    const input = 'https://example.com?utm_source=openai&param=value1&param=value2';
    const expected = 'https://example.com?param=value1&param=value2';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with special characters in the domain', () => {
    const input = 'https://example-site.com?utm_source=openai';
    const expected = 'https://example-site.com';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with path segments', () => {
    const input = 'https://example.com/path/to/resource?utm_source=openai';
    const expected = 'https://example.com/path/to/resource';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with path segments and multiple parameters', () => {
    const input = 'https://example.com/path/to/resource?param1=value1&utm_source=openai&param2=value2';
    const expected = 'https://example.com/path/to/resource?param1=value1&param2=value2';
    expect(removeUtmSource(input)).toBe(expected);
  });
});