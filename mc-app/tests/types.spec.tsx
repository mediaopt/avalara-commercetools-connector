import { expect, test, describe } from '@jest/globals';
import { SettingsFormDataType } from '../src/types/types';

describe('test SettingsFormDataType', () => {
  test('should have the correct properties', () => {
    const data: SettingsFormDataType = {
      accountNumber: '123456789',
      licenseKey: 'abc123',
      companyCode: 'ACME',
      env: true,
      logLevel: 'debug',
      addressValidation: true,
      disableDocRec: false,
      taxCalculation: 'standard',
      enableLogging: true,
      displayPricesWithTax: false,
      line1: '123 Main St',
      line2: 'Apt 4B',
      line3: '',
      postalCode: '12345',
      city: 'New York',
      region: 'NY',
      country: 'US',
    };

    expect(data).toHaveProperty('accountNumber', '123456789');
    expect(data).toHaveProperty('licenseKey', 'abc123');
    expect(data).toHaveProperty('companyCode', 'ACME');
    expect(data).toHaveProperty('env', true);
    expect(data).toHaveProperty('logLevel', 'debug');
    expect(data).toHaveProperty('addressValidation', true);
    expect(data).toHaveProperty('disableDocRec', false);
    expect(data).toHaveProperty('taxCalculation', 'standard');
    expect(data).toHaveProperty('enableLogging', true);
    expect(data).toHaveProperty('displayPricesWithTax', false);
    expect(data).toHaveProperty('line1', '123 Main St');
    expect(data).toHaveProperty('line2', 'Apt 4B');
    expect(data).toHaveProperty('line3', '');
    expect(data).toHaveProperty('postalCode', '12345');
    expect(data).toHaveProperty('city', 'New York');
    expect(data).toHaveProperty('region', 'NY');
    expect(data).toHaveProperty('country', 'US');
  });
});