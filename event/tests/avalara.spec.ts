import {
  describe,
  expect,
  jest,
  afterEach,
  beforeEach,
  it,
} from '@jest/globals';
import { AvataxTransactionManager } from '../src/avalara/index';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { Order } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { ReturnItemHelper } from '../src/avalara/types/index.types';
import { logger } from '../src/utils/logger.utils';
import * as model from '../src/avalara/model';
import {
  extractSalesInvoiceTransaction,
  extractUnlockedReturnTransactionAndCount,
} from '../src/avalara/helpers/transaction.model.helpers';
import { extractReturnItems } from '../src/avalara/helpers/refund.lines.helpers';

jest.mock('avatax/lib/AvaTaxClient');
jest.mock('../src/utils/logger.utils');
jest.mock('../src/avalara/helpers/transaction.model.helpers');
jest.mock('../src/avalara/helpers/refund.lines.helpers');

const mockExtractSalesInvoiceTransaction =
  extractSalesInvoiceTransaction as jest.MockedFunction<
    typeof extractSalesInvoiceTransaction
  >;

const mockExtractUnlockedReturnTransactionAndCount =
  extractUnlockedReturnTransactionAndCount as jest.MockedFunction<
    typeof extractUnlockedReturnTransactionAndCount
  >;

const mockExtractReturnItems = extractReturnItems as jest.MockedFunction<
  typeof extractReturnItems
>;

describe('AvataxTransactionManager', () => {
  let avataxTransactionManager: AvataxTransactionManager;
  let client: AvaTaxClient;
  let companyCode: string;
  let originAddress: AddressInfo;

  beforeEach(() => {
    client = new AvaTaxClient({} as any);
    companyCode = 'test-company-code';
    originAddress = {
      line1: '123 Main St',
      city: 'Anytown',
      region: 'CA',
      country: 'US',
      postalCode: '12345',
    };
    avataxTransactionManager = new AvataxTransactionManager(
      client,
      companyCode,
      originAddress
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRelatedTransactions', () => {
    it('should return related transactions', async () => {
      const mockResponse = { value: [{ id: 'transaction-id' }] };
      client.listTransactionsByCompany = jest.fn(() =>
        Promise.resolve(mockResponse as any)
      );

      const result =
        await avataxTransactionManager.getRelatedTransactions('order-id');

      expect(client.listTransactionsByCompany).toHaveBeenCalledWith({
        companyCode,
        filter: 'code startsWith order-id',
        include: 'lines, addresses, details, summary',
      });
      expect(result).toEqual(mockResponse.value);
    });
  });

  describe('commitTransaction', () => {
    it('should commit a transaction', async () => {
      const order = { id: 'order-id' } as Order;
      const mockModel = { id: 'transaction-model-id' };

      const mockCommitTransactionModel = jest.spyOn(
        model,
        'commitTransactionModel'
      );
      mockCommitTransactionModel.mockReturnValue(mockModel as any);

      client.createOrAdjustTransaction = jest.fn(() =>
        Promise.resolve(mockModel as any)
      );

      const result = await avataxTransactionManager.commitTransaction(order);

      expect(mockCommitTransactionModel).toHaveBeenCalledWith(
        order,
        avataxTransactionManager
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalledWith({
        model: mockModel,
      });
      expect(result).toEqual(mockModel);
    });
  });

  describe('voidTransaction', () => {
    it('should void a transaction', async () => {
      const mockModel = { id: 'void-transaction-model-id' };
      const mockVoidTransactionModel = jest.spyOn(
        model,
        'voidTransactionModel'
      );
      mockVoidTransactionModel.mockReturnValue(mockModel as any);
      client.voidTransaction = jest.fn(() => Promise.resolve(mockModel as any));

      const result = await avataxTransactionManager.voidTransaction('order-id');

      expect(mockVoidTransactionModel).toHaveBeenCalledWith(
        'order-id',
        companyCode
      );
      expect(client.voidTransaction).toHaveBeenCalledWith(mockModel);
      expect(result).toEqual(mockModel);
    });
  });

  describe('refundTransaction', () => {
    it('should refund a transaction', async () => {
      const transaction = {
        id: 'transaction-id',
      } as unknown as TransactionModel;
      const mockModel = { id: 'refund-transaction-model-id' };
      const mockRefundTransactionModel = jest.spyOn(
        model,
        'refundTransactionModel'
      );
      mockRefundTransactionModel.mockReturnValue(mockModel as any);
      client.createOrAdjustTransaction = jest.fn(() =>
        Promise.resolve(mockModel as any)
      );

      const result =
        await avataxTransactionManager.refundTransaction(transaction);

      expect(mockRefundTransactionModel).toHaveBeenCalledWith(
        transaction,
        companyCode
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalledWith({
        model: mockModel,
      });
      expect(result).toEqual(mockModel);
    });
  });

  describe('adjustTransactionLines', () => {
    it('should adjust transaction lines', async () => {
      const returnItems: ReturnItemHelper[] = [
        { itemCode: 'item-code', quantity: 1 },
      ];
      const transaction = {
        id: 'transaction-id',
      } as unknown as TransactionModel;
      const mockModel = { id: 'adjust-transaction-lines-model-id' };
      const mockAdjustTransactionLinesModel = jest.spyOn(
        model,
        'adjustTransactionLinesModel'
      );
      mockAdjustTransactionLinesModel.mockReturnValue(mockModel as any);
      client.createOrAdjustTransaction = jest.fn(() =>
        Promise.resolve(mockModel as any)
      );

      const result = await avataxTransactionManager.adjustTransactionLines(
        returnItems,
        transaction
      );

      expect(mockAdjustTransactionLinesModel).toHaveBeenCalledWith(
        returnItems,
        transaction,
        companyCode
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalledWith({
        model: mockModel,
      });
      expect(result).toEqual(mockModel);
    });
  });

  describe('refundTransactionLines', () => {
    it('should refund transaction lines', async () => {
      const returnItems: ReturnItemHelper[] = [
        { itemCode: 'item-code', quantity: 1 },
      ];
      const salesInvoiceTransaction = {
        id: 'sales-invoice-transaction-id',
      } as unknown as TransactionModel;
      const returnTransactionsCount = 1;
      const unlockedReturnTransaction = {
        id: 'unlocked-return-transaction-id',
      } as unknown as TransactionModel;
      const mockModel = { id: 'refund-transaction-lines-model-id' };
      const mockRefundTransactionLinesModel = jest.spyOn(
        model,
        'refundTransactionLinesModel'
      );
      mockRefundTransactionLinesModel.mockReturnValue(mockModel as any);
      client.createOrAdjustTransaction = jest.fn(() =>
        Promise.resolve(mockModel as any)
      );

      const result = await avataxTransactionManager.refundTransactionLines(
        returnItems,
        salesInvoiceTransaction,
        returnTransactionsCount,
        unlockedReturnTransaction
      );

      expect(mockRefundTransactionLinesModel).toHaveBeenCalledWith(
        returnItems,
        salesInvoiceTransaction,
        returnTransactionsCount,
        unlockedReturnTransaction,
        companyCode
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalledWith({
        model: mockModel,
      });
      expect(result).toEqual(mockModel);
    });
  });

  describe('voidOrRefundTransaction', () => {
    it('should void a transaction if it is not locked', async () => {
      const order = { id: 'order-id', orderNumber: 'order-number' } as Order;
      const relatedTransactions = [
        { id: 'transaction-id', locked: false },
      ] as unknown as TransactionModel[];
      mockExtractSalesInvoiceTransaction.mockReturnValue(
        relatedTransactions[0]
      );
      client.listTransactionsByCompany = jest.fn(() =>
        Promise.resolve({ value: relatedTransactions } as any)
      );

      await avataxTransactionManager.voidOrRefundTransaction(order);

      expect(mockExtractSalesInvoiceTransaction).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(client.voidTransaction).toHaveBeenCalled();
    });

    it('should refund a transaction if it is locked and not refunded', async () => {
      const order = { id: 'order-id', orderNumber: 'order-number' } as Order;
      const relatedTransactions = [
        { id: 'transaction-id', locked: true },
      ] as unknown as TransactionModel[];
      mockExtractSalesInvoiceTransaction.mockReturnValue(
        relatedTransactions[0]
      );
      mockExtractUnlockedReturnTransactionAndCount.mockReturnValue({
        returnTransactionsCount: 0,
      } as any);

      client.listTransactionsByCompany = jest.fn(() =>
        Promise.resolve({ value: relatedTransactions } as any)
      );

      await avataxTransactionManager.voidOrRefundTransaction(order);

      expect(mockExtractSalesInvoiceTransaction).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(mockExtractUnlockedReturnTransactionAndCount).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalled();
    });

    it('should log a message if the transaction is already refunded', async () => {
      const order = { id: 'order-id', orderNumber: 'order-number' } as Order;
      const relatedTransactions = [
        { id: 'transaction-id', locked: true },
      ] as unknown as TransactionModel[];
      mockExtractSalesInvoiceTransaction.mockReturnValue(
        relatedTransactions[0]
      );
      mockExtractUnlockedReturnTransactionAndCount.mockReturnValue({
        returnTransactionsCount: 1,
      } as any);
      client.listTransactionsByCompany = jest.fn(() =>
        Promise.resolve({ value: relatedTransactions } as any)
      );

      await avataxTransactionManager.voidOrRefundTransaction(order);

      expect(mockExtractSalesInvoiceTransaction).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(mockExtractUnlockedReturnTransactionAndCount).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(logger.info).toHaveBeenCalledWith(
        'The transaction order-number has already been completely or partially refunded.'
      );
    });
  });

  describe('adjustOrRefundTransactionLines', () => {
    it('should adjust transaction lines if the transaction is not locked', async () => {
      const order = { id: 'order-id', orderNumber: 'order-number' } as Order;
      const returnItemId = 'return-item-id';
      const returnItems = [{ itemCode: 'item-code', quantity: 1 }];
      const relatedTransactions = [
        { id: 'transaction-id', locked: false },
      ] as unknown as TransactionModel[];
      mockExtractReturnItems.mockReturnValue(returnItems);
      mockExtractSalesInvoiceTransaction.mockReturnValue(
        relatedTransactions[0]
      );
      client.listTransactionsByCompany = jest.fn(() =>
        Promise.resolve({ value: relatedTransactions } as any)
      );
      await avataxTransactionManager.adjustOrRefundTransactionLines(
        returnItemId,
        order
      );

      expect(mockExtractReturnItems).toHaveBeenCalledWith(order, returnItemId);
      expect(mockExtractSalesInvoiceTransaction).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalled();
    });

    it('should refund transaction lines if the transaction is locked', async () => {
      const order = { id: 'order-id', orderNumber: 'order-number' } as Order;
      const returnItemId = 'return-item-id';
      const returnItems = [{ itemCode: 'item-code', quantity: 1 }];
      const relatedTransactions = [
        { id: 'transaction-id', locked: true },
      ] as unknown as TransactionModel[];
      mockExtractReturnItems.mockReturnValue(returnItems);
      mockExtractSalesInvoiceTransaction.mockReturnValue(
        relatedTransactions[0]
      );
      mockExtractUnlockedReturnTransactionAndCount.mockReturnValue({
        returnTransactionsCount: 0,
        unlockedReturnTransaction: undefined,
      });
      client.listTransactionsByCompany = jest.fn(() =>
        Promise.resolve({ value: relatedTransactions } as any)
      );
      await avataxTransactionManager.adjustOrRefundTransactionLines(
        returnItemId,
        order
      );

      expect(mockExtractReturnItems).toHaveBeenCalledWith(order, returnItemId);
      expect(mockExtractSalesInvoiceTransaction).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(mockExtractUnlockedReturnTransactionAndCount).toHaveBeenCalledWith(
        relatedTransactions,
        'order-number'
      );
      expect(client.createOrAdjustTransaction).toHaveBeenCalled();
    });

    it('should log a message if no return items are found', async () => {
      const order = { id: 'order-id', orderNumber: 'order-number' } as Order;
      const returnItemId = 'return-item-id';
      mockExtractReturnItems.mockReturnValue([]);

      await avataxTransactionManager.adjustOrRefundTransactionLines(
        returnItemId,
        order
      );

      expect(mockExtractReturnItems).toHaveBeenCalledWith(order, returnItemId);
      expect(logger.info).toHaveBeenCalledWith('No return items found');
    });
  });
});
