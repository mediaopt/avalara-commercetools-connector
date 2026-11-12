import { CustomFields, ShippingInfo } from '@commercetools/platform-sdk';
import { describe, expect, it, jest, afterEach } from '@jest/globals';
import { shipItem } from '../src/avalara/utils/shipping.info';
import { hashCart } from '../src/utils/hash.utils';
import { logger } from '../src/utils/logger.utils';
import { getShipTaxCode } from '../src/client/data.client';

jest.mock('../src/client/data.client');
jest.mock('../src/utils/logger.utils', () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

const mockGetShipTaxCode = getShipTaxCode as jest.MockedFunction<
  typeof getShipTaxCode
>;

const shippingInfo = {
  price: { centAmount: 1000 },
  taxRate: { includedInPrice: false },
} as ShippingInfo;

const customFields = (fields: Record<string, string>) =>
  ({ fields }) as unknown as CustomFields;

describe('custom shipping tax code', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reads the tax code from the avalaraTaxCode field', async () => {
    const result = await shipItem(
      shippingInfo,
      customFields({ avalaraTaxCode: 'FR020100' })
    );

    expect(result.taxCode).toBe('FR020100');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns and falls back when the code sits in a differently named field', async () => {
    // The integrator case from issue #30: they populated `avatax_code`, the
    // connector reads `avalaraTaxCode`. The warning must name the field read.
    const result = await shipItem(
      shippingInfo,
      customFields({ avatax_code: 'FR020100' })
    );

    expect(result.taxCode).toBe('FR010000');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('avalaraTaxCode')
    );
  });

  it('warns when no shipping method and no custom fields resolve a code', async () => {
    const result = await shipItem(shippingInfo, undefined);

    expect(result.taxCode).toBe('FR010000');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(mockGetShipTaxCode).not.toHaveBeenCalled();
  });
});

describe('hashCart includes the shipping tax code', () => {
  const cart = (taxCode?: string) =>
    ({
      lineItems: [],
      customLineItems: [],
      shippingInfo: { shippingMethod: { id: 'sm-1' }, price: { centAmount: 1000 } },
      ...(taxCode
        ? { shippingCustomFields: { fields: { avalaraTaxCode: taxCode } } }
        : {}),
    }) as any;

  it('changes the digest when the shipping tax code changes', () => {
    // Regression: a changed shipping tax code must invalidate the cached hash,
    // otherwise the connector short-circuits and serves a stale tax result.
    expect(hashCart(cart('FR020100'))).not.toBe(hashCart(cart('FR020200')));
  });

  it('changes the digest when a shipping tax code is added', () => {
    expect(hashCart(cart(undefined))).not.toBe(hashCart(cart('FR020100')));
  });

  it('is stable for an unchanged cart', () => {
    expect(hashCart(cart('FR020100'))).toBe(hashCart(cart('FR020100')));
  });
});
