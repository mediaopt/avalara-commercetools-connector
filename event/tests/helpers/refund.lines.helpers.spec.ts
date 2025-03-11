import { describe, expect, jest, it, afterEach } from '@jest/globals';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { Order } from '@commercetools/platform-sdk';
import { ReturnItemHelper } from '../../src/avalara/types/index.types';
import {
  extractRemainingLines,
  extractRefundLines,
  addRefundLines,
  extractReturnItems,
} from '../../src/avalara/helpers/refund.lines.helpers';
import { convertTransactionLineItemModeltoLineItemModel } from '../../src/avalara/helpers/transaction.model.helpers';

jest.mock('../../src/avalara/helpers/transaction.model.helpers');

const mockConvertTransactionLineItemModeltoLineItemModel =
  convertTransactionLineItemModeltoLineItemModel as jest.MockedFunction<
    typeof convertTransactionLineItemModeltoLineItemModel
  >;

describe('refund.lines.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractRemainingLines', () => {
    it('should extract remaining lines correctly', () => {
      const returnItems: ReturnItemHelper[] = [
        { itemCode: 'item1', quantity: 1 },
      ];
      const taxDocument: CreateOrAdjustTransactionModel = {
        createTransactionModel: {
          lines: [
            { itemCode: 'item1', quantity: 2, amount: 200 },
            { itemCode: 'item2', quantity: 1, amount: 100 },
          ],
        },
      } as any;

      const result = extractRemainingLines(returnItems, taxDocument);

      expect(result).toEqual([
        { itemCode: 'item1', quantity: 1, amount: 100 },
        { itemCode: 'item2', quantity: 1, amount: 100 },
      ]);
    });
  });

  describe('extractRefundLines', () => {
    it('should extract refund lines correctly', () => {
      const returnItems: ReturnItemHelper[] = [
        { itemCode: 'item1', quantity: 1 },
      ];
      const taxDocument: CreateOrAdjustTransactionModel = {
        createTransactionModel: {
          lines: [
            { itemCode: 'item1', quantity: 2, amount: 200 },
            { itemCode: 'item2', quantity: 1, amount: 100 },
          ],
        },
      } as any;

      const result = extractRefundLines(returnItems, taxDocument);

      expect(result).toEqual([
        { itemCode: 'item1', quantity: 1, amount: -100 },
      ]);
    });
  });

  describe('addRefundLines', () => {
    it('should add refund lines correctly', () => {
      const returnItems: ReturnItemHelper[] = [
        { itemCode: 'item1', quantity: 1 },
      ];
      const salesInvoiceTransaction: TransactionModel = {
        lines: [
          { itemCode: 'item1', quantity: 2, amount: 200 },
          { itemCode: 'item2', quantity: 1, amount: 100 },
        ],
      } as any;
      const taxDocument: CreateOrAdjustTransactionModel = {
        createTransactionModel: {
          lines: [],
        },
      } as any;

      mockConvertTransactionLineItemModeltoLineItemModel.mockImplementation(
        (line) => line as any
      );

      const result = addRefundLines(
        returnItems,
        salesInvoiceTransaction,
        taxDocument
      );

      expect(result).toEqual([
        { itemCode: 'item1', quantity: 1, amount: -100 },
      ]);
    });
  });

  describe('extractReturnItems', () => {
    it('should extract return items correctly', () => {
      const order: Order = {
        lineItems: [
          { id: 'lineItem1', variant: { sku: 'item1' } },
          { id: 'lineItem2', variant: { sku: 'item2' } },
        ],
        returnInfo: [
          {
            items: [
              {
                id: 'returnItem1',
                lineItemId: 'lineItem1',
                quantity: 1,
                paymentState: 'Refunded',
              },
              {
                id: 'returnItem2',
                lineItemId: 'lineItem2',
                quantity: 2,
                paymentState: 'NotRefunded',
              },
            ],
          },
        ],
      } as any;

      const result = extractReturnItems(order, 'returnItem1');

      expect(result).toEqual([{ itemCode: 'item1', quantity: 1 }]);
    });

    it('should return an empty array if no return items are found', () => {
      const order: Order = {
        lineItems: [
          { id: 'lineItem1', variant: { sku: 'item1' } },
          { id: 'lineItem2', variant: { sku: 'item2' } },
        ],
        returnInfo: [
          {
            items: [
              {
                id: 'returnItem1',
                lineItemId: 'lineItem1',
                quantity: 1,
                paymentState: 'NotRefunded',
              },
              {
                id: 'returnItem2',
                lineItemId: 'lineItem2',
                quantity: 2,
                paymentState: 'NotRefunded',
              },
            ],
          },
        ],
      } as any;

      const result = extractReturnItems(order, 'returnItem3');

      expect(result).toEqual([]);
    });
  });
});
