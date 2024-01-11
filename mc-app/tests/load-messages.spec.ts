import loadMessages from '../src/load-messages';

describe('loadMessages', () => {
  test('should load messages for "de" locale', async () => {
    const locale = 'de';
    const expectedMessages = {
      'Settings.displayPricesWithTax': 'Bruttopreise anzeigen',
      'Settings.connection': 'Verbindung mit Avalara',
      'Welcome.title': 'Avalara Steuerberechnung',
    };

    const messages = await loadMessages(locale);

    expect(messages['Settings.connection']).toEqual(
      expectedMessages['Settings.connection']
    );
    
    expect(messages['Settings.displayPricesWithTax']).toEqual(
      expectedMessages['Settings.displayPricesWithTax']
    );
    
    expect(messages['Welcome.title']).toEqual(
      expectedMessages['Welcome.title']
    );
  });

  test('should load messages for other locales', async () => {
    const locale = 'en';
    const expectedMessages = {
      'Settings.displayPricesWithTax': 'Display prices with Tax Included',
      'Settings.connection': 'Connection to Avalara',
      'Welcome.title': 'Avalara Tax calculation',
    };

    const messages = await loadMessages(locale);

    expect(messages['Settings.connection']).toEqual(
      expectedMessages['Settings.connection']
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
