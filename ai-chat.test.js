import { removeUtmSource, isRelevant } from './ai-chat.js';

describe('removeUtmSource', () => {
  test('should remove utm_source=openai when it is the only parameter', () => {
    const input = 'Check out this link: https://example.com?utm_source=openai';
    const expected = 'Check out this link: https://example.com';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should remove utm_source=openai when it is the first of multiple parameters', () => {
    const input = 'https://example.com?utm_source=openai&param=value';
    const expected = 'https://example.com?param=value';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should remove utm_source=openai when it is in the middle of parameters', () => {
    const input = 'https://example.com?param1=value1&utm_source=openai&param2=value2';
    const expected = 'https://example.com?param1=value1&param2=value2';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should remove utm_source=openai when it is the last parameter', () => {
    const input = 'https://example.com?param=value&utm_source=openai';
    const expected = 'https://example.com?param=value';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle multiple URLs in the same text', () => {
    const input = 'First link: https://example1.com?utm_source=openai and second link: https://example2.com?param=value&utm_source=openai';
    const expected = 'First link: https://example1.com and second link: https://example2.com?param=value';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should not modify URLs without utm_source parameter', () => {
    const input = 'https://example.com?param=value';
    expect(removeUtmSource(input)).toBe(input);
  });

  test('should handle text without any URLs', () => {
    const input = 'This is just regular text without any URLs';
    expect(removeUtmSource(input)).toBe(input);
  });

  test('should handle empty string', () => {
    expect(removeUtmSource('')).toBe('');
  });

  test('should handle parenthesized URLs', () => {
    const input = 'Check out this link: (https://example.com?utm_source=openai)';
    const expected = 'Check out this link: (https://example.com)';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle markdown links', () => {
    const input = 'Check out this link: [title](https://example.com?utm_source=openai)';
    const expected = 'Check out this link: [title](https://example.com)';
    expect(removeUtmSource(input)).toBe(expected);
  });

  test('should handle markdown links with parenthesis', () => {
    const input = 'Check out this link: ([title](https://example.com?utm_source=openai))';
    const expected = 'Check out this link: ([title](https://example.com))';
    expect(removeUtmSource(input)).toBe(expected);
  });
});

describe('isRelevant', () => {
  test('should return true for Erstregistrierung', async () => {
    expect(await isRelevant('Wie geht die Erstregistrierung eines Mitarbeiters?')).toBe(true);
  }, 10000);

  test('should return true for Karte nicht erkannt', async () => {
    expect(await isRelevant('Meine Karte wird bei der Anmeldung nicht erkannt.')).toBe(true);
  }, 10000);

  test('should return true for BAG', async () => {
    expect(await isRelevant('Muss ich bei Versendung aus dem BAG-Postfach immer elektronisch signieren?')).toBe(true);
  }, 10000);

  test('should return true for PUK', async () => {
    expect(await isRelevant('Wie kann ich meine PUK zurücksetzen?')).toBe(true);
  }, 10000);

  test('should return true for Vertretung', async () => {
    expect(await isRelevant('Wie kann ich eine Vertretung einrichten?')).toBe(true);
  }, 10000);

  test('should return true for Update', async () => {
    expect(await isRelevant('Welche Änderungen gab es im letzten Update?')).toBe(true);
  }, 10000);

  test('should return true for beA-Nachrichten', async () => {
    expect(await isRelevant('Was sind die neuesten beA-Nachrichten?')).toBe(true);
  }, 10000);

  test('should return false for Sportnachrichten', async () => {
    expect(await isRelevant('Was sind die neuesten Sportnachrichten?')).toBe(false);
  }, 10000);
  
  test('should return false for Bayern München', async () => {
    expect(await isRelevant('Wer spielt als nächstes gegen Bayern München?')).toBe(false);
  }, 10000);
  
  test('should return true for start of beA', async () => {
    expect(await isRelevant('Wann startete das beA?')).toBe(true);
  }, 10000);
  
  test('should return false for start of world war 2', async () => {
    expect(await isRelevant('Wann startete der 2. Weltkrieg?')).toBe(false);
  }, 10000);
  
  test('should return false for Erdbeere', async () => {
    expect(await isRelevant("Wieviele Buchstaben 'e' sind im Wort 'Erdbeere' enthalten?")).toBe(false);
  }, 10000);
});