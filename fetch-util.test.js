import { removeUtmSource } from './ai-chat.js';

// Let's add more tests for the removeUtmSource function
describe('removeUtmSource additional tests', () => {
  test('should handle URLs with special characters in parameters', () => {
    const input = 'https://example.com?utm_source=openai&param=value%20with%20spaces';
    // URLSearchParams normalizes %20 to + when toString() is called
    const expected = 'https://example.com?param=value+with+spaces';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with port numbers', () => {
    const input = 'https://example.com:8080?utm_source=openai';
    const expected = 'https://example.com:8080';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle URLs with subdomains', () => {
    const input = 'https://subdomain.example.com?utm_source=openai';
    const expected = 'https://subdomain.example.com';
    expect(removeUtmSource(input)).toBe(expected);
  });
  
  test('should handle URLs with multiple parameters including utm_source', () => {
    const input = 'https://example.com?param1=value1&utm_source=openai&param2=value2';
    const expected = 'https://example.com?param1=value1&param2=value2';
    expect(removeUtmSource(input)).toBe(expected);
  });
  
  test('should handle URLs with utm_source as the only parameter', () => {
    const input = 'https://example.com?utm_source=openai';
    const expected = 'https://example.com';
    expect(removeUtmSource(input)).toBe(expected);
  });
});