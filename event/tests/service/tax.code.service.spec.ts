import { CustomFields, LineItem } from '@commercetools/platform-sdk';
import { describe, expect, jest, it, afterEach } from '@jest/globals';

import {
  getCategories,
  getProductProjections,
  getShippingMethod,
} from '../../src/client/get.client';
import {
  extractItemTaxCode,
  extractShippingMethodTaxCode,
  extractProductsWithTaxCodes,
} from '../../src/service/tax.code.service';

jest.mock('../../src/client/get.client');

const mockGetCategories = getCategories as jest.MockedFunction<
  typeof getCategories
>;
const mockGetProductProjections = getProductProjections as jest.MockedFunction<
  typeof getProductProjections
>;
const mockGetShippingMethod = getShippingMethod as jest.MockedFunction<
  typeof getShippingMethod
>;

describe('tax.code.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractItemTaxCode', () => {
    it('should extract item tax code correctly', () => {
      const item: LineItem = {
        variant: {
          attributes: [{ name: 'taxCode', value: '12345' }],
        },
      } as any;

      process.env.AVATAX_PRODUCT_ATTRIBUTE_NAME = 'taxCode';

      const result = extractItemTaxCode(item);

      expect(result).toBe('12345');
    });

    it('should return undefined if tax code is not found', () => {
      const item: LineItem = {
        variant: {
          attributes: [{ name: 'otherAttribute', value: '67890' }],
        },
      } as any;

      process.env.AVATAX_PRODUCT_ATTRIBUTE_NAME = 'taxCode';

      const result = extractItemTaxCode(item);

      expect(result).toBeUndefined();
    });
  });

  describe('extractShippingMethodTaxCode', () => {
    it('should extract tax code from shipping custom fields', async () => {
      const shippingCustomFields: CustomFields = {
        fields: {
          avalaraTaxCode: 'shippingTaxCode',
        },
      } as any;

      const result = await extractShippingMethodTaxCode(
        undefined,
        shippingCustomFields
      );

      expect(result).toBe('shippingTaxCode');
    });

    it('should extract tax code from shipping method', async () => {
      const shippingMethodId = 'shippingMethodId';
      const mockShippingMethod = {
        custom: {
          fields: {
            avalaraTaxCode: 'shippingTaxCode',
          },
        },
      };
      mockGetShippingMethod.mockResolvedValue(mockShippingMethod as any);

      const result = await extractShippingMethodTaxCode(
        shippingMethodId,
        undefined
      );

      expect(mockGetShippingMethod).toHaveBeenCalledWith(shippingMethodId);
      expect(result).toBe('shippingTaxCode');
    });

    it('should return undefined if no tax code is found', async () => {
      const result = await extractShippingMethodTaxCode(undefined, undefined);

      expect(result).toBeUndefined();
    });
  });

  describe('extractTaxCodesFromCategories', () => {
    it('should extract tax codes from categories correctly', async () => {
      const items: LineItem[] = [
        {
          variant: {
            sku: 'sku1',
            attributes: [{ name: 'otherAttribute', value: '67890' }],
          },
        },
        {
          variant: {
            sku: 'sku2',
            attributes: [{ name: 'taxCode', value: '12345' }],
          },
        },
      ] as any;

      process.env.AVATAX_PRODUCT_ATTRIBUTE_NAME = 'taxCode';

      const mockProductProjections = [
        {
          masterVariant: { sku: 'sku1' },
          categories: [{ id: 'category1' }],
        },
      ];
      mockGetProductProjections.mockResolvedValue(
        mockProductProjections as any
      );

      const mockCategories = [
        {
          id: 'category1',
          custom: {
            fields: {
              avalaraTaxCode: 'categoryTaxCode',
            },
          },
        },
      ];
      mockGetCategories.mockResolvedValue(mockCategories as any);

      const result = await extractProductsWithTaxCodes(items);

      expect(mockGetProductProjections).toHaveBeenCalledWith(['sku1']);
      expect(mockGetCategories).toHaveBeenCalledWith(['category1']);
      expect(result).toEqual([
        {
          sku: 'sku1',
          taxCode: 'categoryTaxCode',
        },
      ]);
    });

    it('should return an empty array if no items without tax codes are found', async () => {
      const items: LineItem[] = [
        {
          variant: {
            sku: 'sku1',
            attributes: [{ name: 'taxCode', value: '12345' }],
          },
        },
      ] as any;

      process.env.AVATAX_PRODUCT_ATTRIBUTE_NAME = 'taxCode';

      const result = await extractProductsWithTaxCodes(items);

      expect(result).toEqual([]);
    });
  });
});
