import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { convertTransactionModelToCreateTransactionModel } from '../../src/avalara/helpers/transaction.model.helpers';
import { TaxOverrideType } from 'avatax/lib/enums/TaxOverrideType';
import {
  addRefundLines,
  extractRefundLines,
} from '../../src/avalara/helpers/refund.lines.helpers';
import { ReturnItemHelper } from '../../src/avalara/types/index.types';
import { refundTransactionLinesModel } from '../../src/avalara/model/transaction-model/refund.transaction.lines.model';
import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock('../../src/avalara/helpers/transaction.model.helpers');
jest.mock('../../src/avalara/helpers/refund.lines.helpers');

const mockConvertTransactionModelToCreateTransactionModel =
  convertTransactionModelToCreateTransactionModel as jest.MockedFunction<
    typeof convertTransactionModelToCreateTransactionModel
  >;
const mockExtractRefundLines = extractRefundLines as jest.MockedFunction<
  typeof extractRefundLines
>;
const mockAddRefundLines = addRefundLines as jest.MockedFunction<
  typeof addRefundLines
>;

describe('refundTransactionLinesModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a CreateOrAdjustTransactionModel for refunding transaction lines when no return transactions or unlocked return transaction', () => {
    const returnItems: ReturnItemHelper[] = [
      { itemCode: 'item1', quantity: 1 },
    ];
    const salesInvoiceTransaction: TransactionModel = {
      code: 'transaction-code',
      taxDate: new Date(),
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
    const returnTransactionsCount = 0;
    const unlockedReturnTransaction = undefined;
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

    mockExtractRefundLines.mockReturnValue([
      {
        number: '1',
        quantity: 1,
        amount: -50,
        taxCode: 'tax-code',
        itemCode: 'item1',
        taxIncluded: true,
        parameters: {} as any,
        description: 'description',
        businessIdentificationNo: 'business-id',
      },
    ]);

    const result = refundTransactionLinesModel(
      returnItems,
      salesInvoiceTransaction,
      returnTransactionsCount,
      unlockedReturnTransaction,
      companyCode
    );

    expect(result).toBeInstanceOf(CreateOrAdjustTransactionModel);
    expect(result.createTransactionModel.code).toBe('transaction-code-R1');
    expect(result.createTransactionModel.referenceCode).toBe('Refund');
    expect(result.createTransactionModel.taxOverride).toEqual({
      taxDate: salesInvoiceTransaction.taxDate,
      type: TaxOverrideType.TaxDate,
      reason: 'Refund',
    });
    expect(result.createTransactionModel.lines).toEqual([
      {
        number: '1',
        quantity: 1,
        amount: -50,
        taxCode: 'tax-code',
        itemCode: 'item1',
        taxIncluded: true,
        parameters: {},
        description: 'description',
        businessIdentificationNo: 'business-id',
      },
    ]);
  });

  it('should create a CreateOrAdjustTransactionModel for refunding transaction lines when there is an unlocked return transaction', () => {
    const returnItems: ReturnItemHelper[] = [
      { itemCode: 'item1', quantity: 1 },
    ];
    const salesInvoiceTransaction: TransactionModel = {
      code: 'transaction-code',
      taxDate: new Date(),
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
    const returnTransactionsCount = 1;
    const unlockedReturnTransaction: TransactionModel = {
      code: 'transaction-code-R1',
      lines: [
        {
          lineNumber: '1',
          quantity: 1,
          lineAmount: 50,
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
      code: 'transaction-code-R1',
      lines: [
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
      ],
      type: 'ReturnInvoice',
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

    mockAddRefundLines.mockReturnValue([
      {
        number: '1',
        quantity: 1,
        amount: -50,
        taxCode: 'tax-code',
        itemCode: 'item1',
        taxIncluded: true,
        parameters: {} as any,
        description: 'description',
        businessIdentificationNo: 'business-id',
      },
    ]);

    const result = refundTransactionLinesModel(
      returnItems,
      salesInvoiceTransaction,
      returnTransactionsCount,
      unlockedReturnTransaction,
      companyCode
    );

    expect(result).toBeInstanceOf(CreateOrAdjustTransactionModel);
    expect(result.createTransactionModel.code).toBe('transaction-code-R1');
    expect(result.createTransactionModel.lines).toEqual([
      {
        number: '1',
        quantity: 1,
        amount: -50,
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
