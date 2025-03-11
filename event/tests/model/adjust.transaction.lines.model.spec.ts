import { AdjustmentReason } from 'avatax/lib/enums/AdjustmentReason';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { convertTransactionModelToCreateTransactionModel } from '../../src/avalara/helpers/transaction.model.helpers';
import { extractRemainingLines } from '../../src/avalara/helpers/refund.lines.helpers';
import { ReturnItemHelper } from '../../src/avalara/types/index.types';
import { adjustTransactionLinesModel } from '../../src/avalara/model/transaction-model/adjust.transaction.lines.model';
import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock('../../src/avalara/helpers/transaction.model.helpers');
jest.mock('../../src/avalara/helpers/refund.lines.helpers');

const mockConvertTransactionModelToCreateTransactionModel =
  convertTransactionModelToCreateTransactionModel as jest.MockedFunction<
    typeof convertTransactionModelToCreateTransactionModel
  >;
const mockExtractRemainingLines = extractRemainingLines as jest.MockedFunction<
  typeof extractRemainingLines
>;

describe('adjustTransactionLinesModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a CreateOrAdjustTransactionModel for adjusting transaction lines', () => {
    const returnItems: ReturnItemHelper[] = [
      { itemCode: 'item1', quantity: 1 },
    ];
    const transaction: TransactionModel = {
      code: 'transaction-code',
      lines: [
        {
          lineNumber: '1',
          quantity: 2,
          lineAmount: 100,
          taxCode: 'tax-code',
          itemCode: 'item1',
          taxIncluded: true,
          parameters: {},
          description: 'description',
          businessIdentificationNo: 'business-id',
        },
      ],
    } as any;
    const companyCode = 'company-code';

    mockConvertTransactionModelToCreateTransactionModel.mockReturnValue({
      code: 'transaction-code',
      lines: [
        {
          number: '1',
          quantity: 2,
          amount: 100,
          taxCode: 'tax-code',
          itemCode: 'item1',
          taxIncluded: true,
          parameters: {},
          description: 'description',
          businessIdentificationNo: 'business-id',
        },
      ],
      type: 'SalesInvoice',
      companyCode: 'company-code',
      date: new Date(),
      salespersonCode: 'salesperson-code',
      customerCode: 'customer-code',
      customerUsageType: 'customer-usage-type',
      entityUseCode: 'entity-use-code',
      purchaseOrderNo: 'purchase-order-no',
      businessIdentificationNo: 'business-id',
      currencyCode: 'USD',
      exchangeRate: 1,
      exchangeRateEffectiveDate: new Date(),
      description: 'description',
      email: 'email@example.com',
      reportingLocationCode: 'reporting-location-code',
      commit: true,
      batchCode: 'batch-code',
      parameters: {},
      addresses: {
        shipFrom: {
          line1: 'line1',
          line2: 'line2',
          line3: 'line3',
          city: 'city',
          region: 'region',
          country: 'country',
          postalCode: 'postal-code',
        },
        shipTo: {
          line1: 'line1',
          line2: 'line2',
          line3: 'line3',
          city: 'city',
          region: 'region',
          country: 'country',
          postalCode: 'postal-code',
        },
      },
      referenceCode: 'reference-code',
    } as any);

    mockExtractRemainingLines.mockReturnValue([
      {
        number: '1',
        quantity: 1,
        amount: 50,
        taxCode: 'tax-code',
        itemCode: 'item1',
        taxIncluded: true,
        parameters: {} as any,
        description: 'description',
        businessIdentificationNo: 'business-id',
      },
    ]);

    const result = adjustTransactionLinesModel(
      returnItems,
      transaction,
      companyCode
    );

    expect(result).toBeInstanceOf(CreateOrAdjustTransactionModel);
    expect(result.createTransactionModel.code).toBe('transaction-code');
    expect(result.adjustmentReason).toBe(AdjustmentReason.ProductReturned);
    expect(result.adjustmentDescription).toBe('Product Returned');
    expect(result.createTransactionModel.lines).toEqual([
      {
        number: '1',
        quantity: 1,
        amount: 50,
        taxCode: 'tax-code',
        itemCode: 'item1',
        taxIncluded: true,
        parameters: {},
        description: 'description',
        businessIdentificationNo: 'business-id',
      },
    ]);
  });
});
