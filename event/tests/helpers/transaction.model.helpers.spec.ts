import { TransactionAddressModel } from 'avatax/lib/models/TransactionAddressModel';
import { TransactionLineModel } from 'avatax/lib/models/TransactionLineModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import {
  convertTransactionModelToCreateTransactionModel,
  convertTransactionLineItemModeltoLineItemModel,
  extractAddressesFromTransactionModel,
  convertTransactionAddressModelToAddressLocationInfo,
  extractSalesInvoiceTransaction,
  extractReturnTransactions,
} from '../../src/avalara/helpers/transaction.model.helpers';
import { describe, expect, it } from '@jest/globals';

describe('transaction.model.helpers', () => {
  describe('convertTransactionModelToCreateTransactionModel', () => {
    it('should convert TransactionModel to CreateTransactionModel', () => {
      const transaction: TransactionModel = {
        code: 'transaction-code',
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
        originAddressId: 'address-id',
        destinationAddressId: 'address-id',
        addresses: [
          {
            id: 'address-id',
            line1: 'line1',
            line2: 'line2',
            line3: 'line3',
            city: 'city',
            region: 'region',
            country: 'country',
            postalCode: 'postal-code',
          },
        ],
        referenceCode: 'reference-code',
      } as any;

      const companyCode = 'company-code';

      const result = convertTransactionModelToCreateTransactionModel(
        transaction,
        companyCode
      );

      expect(result).toEqual({
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
        ],
        type: 'SalesInvoice',
        companyCode: 'company-code',
        date: transaction.date,
        salespersonCode: 'salesperson-code',
        customerCode: 'customer-code',
        customerUsageType: 'customer-usage-type',
        entityUseCode: 'entity-use-code',
        purchaseOrderNo: 'purchase-order-no',
        businessIdentificationNo: 'business-id',
        currencyCode: 'USD',
        exchangeRate: 1,
        exchangeRateEffectiveDate: transaction.exchangeRateEffectiveDate,
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
      });
    });
  });

  describe('convertTransactionLineItemModeltoLineItemModel', () => {
    it('should convert TransactionLineModel to LineItemModel', () => {
      const transactionLine: TransactionLineModel = {
        lineNumber: '1',
        quantity: 2,
        lineAmount: 100,
        taxCode: 'tax-code',
        itemCode: 'item-code',
        taxIncluded: true,
        parameters: {},
        description: 'description',
        businessIdentificationNo: 'business-id',
      } as any;

      const result =
        convertTransactionLineItemModeltoLineItemModel(transactionLine);

      expect(result).toEqual({
        number: '1',
        quantity: 2,
        amount: 100,
        taxCode: 'tax-code',
        itemCode: 'item-code',
        taxIncluded: true,
        parameters: {},
        description: 'description',
        businessIdentificationNo: 'business-id',
      });
    });
  });

  describe('extractAddressesFromTransactionModel', () => {
    it('should extract addresses from TransactionModel', () => {
      const transaction: TransactionModel = {
        addresses: [
          {
            id: 'origin-address-id',
            line1: 'line1',
            line2: 'line2',
            line3: 'line3',
            city: 'city',
            region: 'region',
            country: 'country',
            postalCode: 'postal-code',
          },
          {
            id: 'destination-address-id',
            line1: 'line1',
            line2: 'line2',
            line3: 'line3',
            city: 'city',
            region: 'region',
            country: 'country',
            postalCode: 'postal-code',
          },
        ],
        originAddressId: 'origin-address-id',
        destinationAddressId: 'destination-address-id',
      } as any;

      const result = extractAddressesFromTransactionModel(transaction);

      expect(result).toEqual({
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
      });
    });
  });

  describe('convertTransactionAddressModelToAddressLocationInfo', () => {
    it('should convert TransactionAddressModel to AddressLocationInfo', () => {
      const transactionAddress: TransactionAddressModel = {
        line1: 'line1',
        line2: 'line2',
        line3: 'line3',
        city: 'city',
        region: 'region',
        country: 'country',
        postalCode: 'postal-code',
      } as any;

      const result =
        convertTransactionAddressModelToAddressLocationInfo(transactionAddress);

      expect(result).toEqual({
        line1: 'line1',
        line2: 'line2',
        line3: 'line3',
        city: 'city',
        region: 'region',
        country: 'country',
        postalCode: 'postal-code',
      });
    });
  });

  describe('extractSalesInvoiceTransaction', () => {
    it('should extract sales invoice transaction', () => {
      const transactions: TransactionModel[] = [
        {
          type: 'SalesInvoice',
          code: 'order-id',
          status: 'Committed',
        },
        {
          type: 'ReturnInvoice',
          code: 'order-id-R1',
          status: 'Committed',
        },
      ] as any;

      const result = extractSalesInvoiceTransaction(transactions, 'order-id');

      expect(result).toEqual({
        type: 'SalesInvoice',
        code: 'order-id',
        status: 'Committed',
      });
    });
  });

  describe('extractReturnTransactionCount', () => {
    it('should extract return transaction count', () => {
      const transactions: TransactionModel[] = [
        {
          type: 'SalesInvoice',
          code: 'order-id',
          status: 'Committed',
        },
        {
          type: 'ReturnInvoice',
          code: 'order-id-R1',
          status: 'Committed',
          locked: true,
        },
        {
          type: 'ReturnInvoice',
          code: 'order-id-R2',
          status: 'Committed',
          locked: false,
        },
      ] as any;

      const result = extractReturnTransactions(transactions, 'order-id');

      expect(result.length).toEqual(2);
    });
  });
});
