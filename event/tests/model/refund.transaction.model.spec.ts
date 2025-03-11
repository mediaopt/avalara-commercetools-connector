import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { TaxOverrideType } from 'avatax/lib/enums/TaxOverrideType';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { describe, expect, it, jest, afterEach } from '@jest/globals';
import {
  convertTransactionLineItemModeltoLineItemModel,
  convertTransactionModelToCreateTransactionModel,
} from '../../src/avalara/helpers/transaction.model.helpers';
import { refundTransactionModel } from '../../src/avalara/model/transaction-model/refund.transaction.model';

jest.mock('../../src/avalara/helpers/transaction.model.helpers');

const mockConvertTransactionModelToCreateTransactionModel =
  convertTransactionModelToCreateTransactionModel as jest.MockedFunction<
    typeof convertTransactionModelToCreateTransactionModel
  >;
const mockConvertTransactionLineItemModeltoLineItemModel =
  convertTransactionLineItemModeltoLineItemModel as jest.MockedFunction<
    typeof convertTransactionLineItemModeltoLineItemModel
  >;

describe('refundTransactionModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a CreateOrAdjustTransactionModel for a refund', () => {
    const transaction: TransactionModel = {
      code: 'transaction-code',
      taxDate: new Date(),
      lines: [
        {
          lineNumber: '1',
          quantity: 2,
          lineAmount: 100,
          taxCode: 'tax-code',
          itemCode: 'item-code',
          taxIncluded: true,
          parameters: {},
          description: 'description',
          businessIdentificationNo: 'business-id',
        },
        {
          lineNumber: '2',
          quantity: 1,
          lineAmount: 50,
          taxCode: 'tax-code',
          itemCode: 'Shipping',
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
          itemCode: 'item-code',
          taxIncluded: true,
          parameters: {},
          description: 'description',
          businessIdentificationNo: 'business-id',
        },
        {
          number: '2',
          quantity: 1,
          amount: 50,
          taxCode: 'tax-code',
          itemCode: 'Shipping',
          taxIncluded: true,
          parameters: {},
          description: 'description',
          businessIdentificationNo: 'business-id',
        },
      ],
      type: DocumentType.SalesInvoice,
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

    mockConvertTransactionLineItemModeltoLineItemModel.mockImplementation(
      (line) => ({
        number: line.lineNumber,
        quantity: line.quantity,
        amount: line.lineAmount as number,
        taxCode: line.taxCode,
        itemCode: line.itemCode,
        taxIncluded: line.taxIncluded,
        parameters: line.parameters,
        description: line.description,
        businessIdentificationNo: line.businessIdentificationNo,
      })
    );

    const result = refundTransactionModel(transaction, companyCode);

    expect(result).toBeInstanceOf(CreateOrAdjustTransactionModel);
    expect(result.createTransactionModel.referenceCode).toBe('Refund');
    expect(result.createTransactionModel.type).toBe(DocumentType.ReturnInvoice);
    expect(result.createTransactionModel.code).toBe('transaction-code-R');
    expect(result.createTransactionModel.lines).toEqual([
      {
        number: '1',
        quantity: 2,
        amount: -100,
        taxCode: 'tax-code',
        itemCode: 'item-code',
        taxIncluded: true,
        parameters: {},
        description: 'description',
        businessIdentificationNo: 'business-id',
      },
    ]);
    expect(result.createTransactionModel.taxOverride).toEqual({
      taxDate: transaction.taxDate,
      type: TaxOverrideType.TaxDate,
      reason: 'Refund',
    });
  });
});
