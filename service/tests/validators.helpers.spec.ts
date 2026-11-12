import { describe, expect, it } from '@jest/globals';
import {
  array,
  getValidateMessages,
  optional,
  standardEmail,
  standardKey,
  standardNaturalNumber,
  standardString,
  standardUrl,
} from '../src/validators/helpers.validators';

describe('validator helpers', () => {
  it('validates natural numbers, emails, keys, and URLs', () => {
    const naturalNumber: any = standardNaturalNumber(['count'], {
      message: 'count',
    } as any);
    const email: any = standardEmail(['email'], { message: 'email' } as any);
    const key: any = standardKey(['key'], { message: 'key' } as any);
    const url: any = standardUrl(['url'], { message: 'url' } as any);

    expect(naturalNumber[1][0][0]('12')).toBe(true);
    expect(naturalNumber[1][0][0]('1.2')).toBe(false);
    expect(email[1][0][0]('user@example.com')).toBe(true);
    expect(key[1][0][0]('valid-key')).toBe(true);
    expect(key[1][0][0]('not valid')).toBe(false);
    expect(url[1][0][0]('https://example.com', url[1][0][2][0])).toBe(true);
  });

  it('returns validation messages for invalid values', () => {
    const config = [
      standardString(['name'], 'Name is invalid' as any, { min: 3 }),
    ];

    expect(getValidateMessages(config, { name: 'x' })).toEqual([
      'Name is invalid',
    ]);
    expect(getValidateMessages(config, { name: 'valid' })).toEqual([]);
  });

  it('supports optional and array-wrapped validators', () => {
    const optionalString: any = optional(standardString)(
      ['name'],
      'Name is invalid' as any,
      { min: 3 }
    );
    const arrayString: any = array(standardString)(
      ['names'],
      'Names are invalid' as any,
      { min: 3 }
    );

    expect(optionalString[1][0][0](undefined)).toBe(true);
    expect(optionalString[1][0][0]('x', { min: 3 })).toBe(false);
    expect(arrayString[1][0][0](['x'])).toBe(true);
    expect(arrayString[1][0][0](['one', 'two'])).toBe(true);
    expect(arrayString[1][0][0]('not-an-array')).toBe(false);
  });
});
