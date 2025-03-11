import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { AvataxTransactionManager } from '../../src/avalara';
import { extractTaxCodesFromCategories } from '../../src/avalara/helpers/tax.code.helpers';
import { extractEntityUseCode } from '../../src/avalara/helpers/entity.use.code.helpers';
import { convertShippingAddressModel } from '../../src/avalara/model/shipping.address.model';
import { convertLineItemModel } from '../../src/avalara/model/line-item-model/line.item.model';
import { convertCustomLineItemModel } from '../../src/avalara/model/line-item-model/custom.line.item.model';
import { convertShippingInfoModel } from '../../src/avalara/model/line-item-model/shipping.info.model';
import { commitTransactionModel } from '../../src/avalara/model/transaction-model/commit.transaction.model';
import {
  describe,
  expect,
  it,
  jest,
  afterEach,
  beforeEach,
} from '@jest/globals';

jest.mock('../../src/avalara/helpers/tax.code.helpers');
jest.mock('../../src/avalara/helpers/entity.use.code.helpers');
jest.mock('../../src/avalara/model/shipping.address.model');
jest.mock('../../src/avalara/model/line-item-model/line.item.model');
jest.mock('../../src/avalara/model/line-item-model/custom.line.item.model');
jest.mock('../../src/avalara/model/line-item-model/shipping.info.model');

const mockExtractTaxCodesFromCategories =
  extractTaxCodesFromCategories as jest.MockedFunction<
    typeof extractTaxCodesFromCategories
  >;
const mockExtractEntityUseCode = extractEntityUseCode as jest.MockedFunction<
  typeof extractEntityUseCode
>;
const mockConvertShippingAddressModel =
  convertShippingAddressModel as jest.MockedFunction<
    typeof convertShippingAddressModel
  >;
const mockConvertLineItemModel = convertLineItemModel as jest.MockedFunction<
  typeof convertLineItemModel
>;
const mockConvertCustomLineItemModel =
  convertCustomLineItemModel as jest.MockedFunction<
    typeof convertCustomLineItemModel
  >;
const mockConvertShippingInfoModel =
  convertShippingInfoModel as jest.MockedFunction<
    typeof convertShippingInfoModel
  >;

describe('commitTransactionModel', () => {
  let order: any;
  let transactionManager: AvataxTransactionManager;

  beforeEach(() => {
    order = {
      id: 'order-id',
      orderNumber: 'order-number',
      shippingAddress: {
        streetName: 'Main St',
        streetNumber: '123',
        additionalStreetInfo: 'Apt 4B',
        postalCode: '12345',
        city: 'Anytown',
        state: 'CA',
        country: 'US',
      },
      shippingInfo: {
        price: { centAmount: 1000 },
        shippingMethodName: 'Standard Shipping',
        taxRate: { includedInPrice: true },
        shippingMethod: { id: 'shipping-method-id' },
      },
      lineItems: [
        {
          quantity: 2,
          totalPrice: { centAmount: 2000 },
          name: { en: 'Test Product' },
          variant: { sku: 'test-sku' },
          taxRate: { includedInPrice: true },
        },
      ],
      customLineItems: [
        {
          quantity: 1,
          totalPrice: { centAmount: 1000 },
          name: { en: 'Custom Item' },
          key: 'custom-key',
          id: 'custom-id',
          taxRate: { includedInPrice: true },
          custom: {
            fields: {
              avalaraTaxCode: 'custom-tax-code',
            },
          },
        },
      ],
      customerId: 'customer-id',
      totalPrice: { currencyCode: 'USD' },
    } as any;

    transactionManager = {
      originAddress: {
        line1: 'Warehouse St',
        city: 'Warehouse City',
        region: 'WH',
        country: 'US',
        postalCode: '67890',
      },
      companyCode: 'company-code',
    } as any;

    mockExtractTaxCodesFromCategories.mockResolvedValue([
      { sku: 'test-sku', taxCode: 'category-tax-code' },
    ]);
    mockExtractEntityUseCode.mockResolvedValue({
      customerNumber: 'customer-number',
      entityUseCode: 'entity-use-code',
    });
    mockConvertShippingAddressModel.mockReturnValue({
      line1: 'Main St',
      line2: '123',
      line3: 'Apt 4B',
      postalCode: '12345',
      city: 'Anytown',
      region: 'CA',
      country: 'US',
    });
    mockConvertLineItemModel.mockReturnValue({
      quantity: 2,
      amount: 20,
      description: 'Test Product',
      itemCode: 'test-sku',
      taxIncluded: true,
      taxCode: 'category-tax-code',
    });
    mockConvertCustomLineItemModel.mockReturnValue({
      quantity: 1,
      amount: 10,
      description: 'Custom Item',
      itemCode: 'custom-key',
      taxIncluded: true,
      taxCode: 'custom-tax-code',
    });
    mockConvertShippingInfoModel.mockResolvedValue({
      quantity: 1,
      amount: 10,
      description: 'Standard Shipping',
      itemCode: 'Shipping',
      taxIncluded: true,
      taxCode: 'shipping-tax-code',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a CreateOrAdjustTransactionModel from an Order', async () => {
    const result = await commitTransactionModel(order, transactionManager);

    expect(result).toBeInstanceOf(CreateOrAdjustTransactionModel);
    expect(result.createTransactionModel).toBeInstanceOf(
      CreateTransactionModel
    );
    expect(result.createTransactionModel.date).toBeInstanceOf(Date);
    expect(result.createTransactionModel.code).toBe('order-number');
    expect(result.createTransactionModel.commit).toBe(true);
    expect(result.createTransactionModel.companyCode).toBe('company-code');
    expect(result.createTransactionModel.type).toBe(DocumentType.SalesInvoice);
    expect(result.createTransactionModel.currencyCode).toBe('USD');
    expect(result.createTransactionModel.customerCode).toBe('customer-number');
    expect(result.createTransactionModel.addresses).toEqual({
      shipFrom: transactionManager.originAddress,
      shipTo: {
        line1: 'Main St',
        line2: '123',
        line3: 'Apt 4B',
        postalCode: '12345',
        city: 'Anytown',
        region: 'CA',
        country: 'US',
      },
    });
    expect(result.createTransactionModel.entityUseCode).toBe('entity-use-code');
    expect(result.createTransactionModel.lines).toEqual([
      {
        quantity: 2,
        amount: 20,
        description: 'Test Product',
        itemCode: 'test-sku',
        taxIncluded: true,
        taxCode: 'category-tax-code',
      },
      {
        quantity: 1,
        amount: 10,
        description: 'Custom Item',
        itemCode: 'custom-key',
        taxIncluded: true,
        taxCode: 'custom-tax-code',
      },
      {
        quantity: 1,
        amount: 10,
        description: 'Standard Shipping',
        itemCode: 'Shipping',
        taxIncluded: true,
        taxCode: 'shipping-tax-code',
      },
    ]);
  });

  it('should handle missing shipping address and shipping info', async () => {
    order.shippingAddress = undefined;
    order.shippingInfo = undefined;

    const result = await commitTransactionModel(order, transactionManager);

    expect(result).toBeInstanceOf(CreateOrAdjustTransactionModel);
    expect(result.createTransactionModel).toBeUndefined();
  });
});
