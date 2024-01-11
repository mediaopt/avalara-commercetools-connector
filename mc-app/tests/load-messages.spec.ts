import loadMessages from '../src/load-messages';

describe('loadMessages', () => {
  test('should load messages for "de" locale', async () => {
    const locale = 'de';
    const expectedMessages = {
      // Needs to added expected translations for "de" locale here. Note that the de.json file is empty and leaved empty here, as well.
    };

    const messages = await loadMessages(locale);

    expect(messages).toEqual(expectedMessages);
  });

  test('should load messages for other locales', async () => {
    const locale = 'en';
    const expectedMessages = {
      'Settings.displayPricesWithTax': 'Display prices with Tax Included',
      'Settings.settings': 'Avalara Credentials',
      'Welcome.title': 'Avalara Tax calculation',
    };

    const messages = await loadMessages(locale);

    expect(messages['Settings.settings']).toEqual(
      expectedMessages['Settings.settings']
    );
    
    expect(messages['Settings.displayPricesWithTax']).toEqual(
      expectedMessages['Settings.displayPricesWithTax']
    );
    
    expect(messages['Welcome.title']).toEqual(
      expectedMessages['Welcome.title']
    );
  });

  test('should handle error while loading messages', async () => {
    const locale = 'en';
    const expectedMessages = {};

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

    const _ = await loadMessages(locale);

    expect(console.warn).toHaveBeenCalledTimes(0);
  });
});
