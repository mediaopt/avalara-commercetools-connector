import { Address } from '@commercetools/platform-sdk';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { describe, expect, it } from '@jest/globals';
import { convertShippingAddressModel } from '../../src/avalara/model/shipping.address.model';

describe('convertShippingAddressModel', () => {
  it('should convert CT Address Model to Avalara Address Model', () => {
    const address: Address = {
      streetName: 'Main St',
      streetNumber: '123',
      additionalStreetInfo: 'Apt 4B',
      postalCode: '12345',
      city: 'Anytown',
      state: 'CA',
      country: 'US',
    } as any;

    const result = convertShippingAddressModel(address);

    expect(result).toBeInstanceOf(AddressInfo);
    expect(result.line1).toBe('Main St');
    expect(result.line2).toBe('123');
    expect(result.line3).toBe('Apt 4B');
    expect(result.postalCode).toBe('12345');
    expect(result.city).toBe('Anytown');
    expect(result.region).toBe('CA');
    expect(result.country).toBe('US');
  });

  it('should handle missing address fields', () => {
    const address: Address = {} as any;

    const result = convertShippingAddressModel(address);

    expect(result).toBeInstanceOf(AddressInfo);
    expect(result.line1).toBeUndefined();
    expect(result.line2).toBeUndefined();
    expect(result.line3).toBeUndefined();
    expect(result.postalCode).toBeUndefined();
    expect(result.city).toBeUndefined();
    expect(result.region).toBeUndefined();
    expect(result.country).toBeUndefined();
  });
});
