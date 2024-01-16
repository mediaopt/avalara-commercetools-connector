import loadMessages from '../src/load-messages';

describe('loadMessages', () => {
  test('should have same keys for "de" and "en" locales', async () => {
    const enLocale = 'en';
    const enMessages = await loadMessages(enLocale);

    const deLocale = 'de';
    const deMessageKeys = Object.keys(await loadMessages(deLocale));

    for (const key in enMessages) {
      expect(deMessageKeys).toContain(key);
    }
  });

  test('should have different messages for "de" and "en" locales', async () => {
    const enLocale = 'en';
    const enMessages = await loadMessages(enLocale);

    const deLocale = 'de';
    const deMessages = await loadMessages(deLocale);

    for (const message in enMessages) {
      expect(enMessages[message]).not.toBe(deMessages[message]);
    }
  });

  test('should load messages for other locales', async () => {
    const locale = 'en';
    const messages = await loadMessages(locale);

    for (const message in messages) {
      expect(messages[message]).toBeDefined();
      expect(messages[message]).not.toBe('');
    }
  });

  test('should load messages for "de" locale', async () => {
    const locale = 'de';
    const messages = await loadMessages(locale);

    for (const message in messages) {
      expect(messages[message]).toBeDefined();
      expect(messages[message]).not.toBe('');
    }
  });

  test('should handle error while loading messages', async () => {
    const locale = 'en';

    // Mocking the error thrown by getChunkImport
    const handledErrorImplementation = (error: Error) => {
      console.warn(
        `Something went wrong while loading the app messages for ${locale}`,
        error
      );
      return {};
    };
    jest.spyOn(console, 'warn').mockImplementation(handledErrorImplementation);
    jest.spyOn(console, 'error').mockImplementation(handledErrorImplementation);

    await loadMessages(locale);

    expect(console.warn).toHaveBeenCalledTimes(0);
  });
});
