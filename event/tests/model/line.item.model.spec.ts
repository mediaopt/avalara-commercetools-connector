import { LineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { extractItemTaxCode } from '../../src/avalara/helpers/tax.code.helpers';
import { ProductWithCategoryTaxCode } from '../../src/avalara/types/index.types';
import { convertLineItemModel } from '../../src/avalara/model/line-item-model/line.item.model';
import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock('../../src/avalara/helpers/tax.code.helpers');

const mockExtractItemTaxCode = extractItemTaxCode as jest.MockedFunction<
  typeof extractItemTaxCode
>;

describe('convertLineItemModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should convert CT LineItem Model to Avalara LineItem Model', () => {
    const item: LineItem = {
      quantity: 2,
      totalPrice: { centAmount: 2000 },
      name: { en: 'Test Product' },
      variant: { sku: 'test-sku' },
      taxRate: { includedInPrice: true },
    } as any;

    const productsWithCategoryTaxCodes: ProductWithCategoryTaxCode[] = [
      { sku: 'test-sku', taxCode: 'category-tax-code' },
    ];

    mockExtractItemTaxCode.mockReturnValue('item-tax-code');

    const result = convertLineItemModel(item, productsWithCategoryTaxCodes);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(2);
    expect(result.amount).toBe(20);
    expect(result.description).toBe('Test Product');
    expect(result.itemCode).toBe('test-sku');
    expect(result.taxIncluded).toBe(true);
    expect(result.taxCode).toBe('item-tax-code');
  });

  it('should use category tax code if item tax code is not found', () => {
    const item: LineItem = {
      quantity: 2,
      totalPrice: { centAmount: 2000 },
      name: { en: 'Test Product' },
      variant: { sku: 'test-sku' },
      taxRate: { includedInPrice: true },
    } as any;

    const productsWithCategoryTaxCodes: ProductWithCategoryTaxCode[] = [
      { sku: 'test-sku', taxCode: 'category-tax-code' },
    ];

    mockExtractItemTaxCode.mockReturnValue(undefined);

    const result = convertLineItemModel(item, productsWithCategoryTaxCodes);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(2);
    expect(result.amount).toBe(20);
    expect(result.description).toBe('Test Product');
    expect(result.itemCode).toBe('test-sku');
    expect(result.taxIncluded).toBe(true);
    expect(result.taxCode).toBe('category-tax-code');
  });

  it('should handle missing fields in LineItem', () => {
    const item: LineItem = {} as any;

    const productsWithCategoryTaxCodes: ProductWithCategoryTaxCode[] = [];

    const result = convertLineItemModel(item, productsWithCategoryTaxCodes);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBeUndefined();
    expect(result.amount).toBeNaN();
    expect(result.description).toBeUndefined();
    expect(result.itemCode).toBeUndefined();
    expect(result.taxIncluded).toBeUndefined();
    expect(result.taxCode).toBeUndefined();
  });
});
