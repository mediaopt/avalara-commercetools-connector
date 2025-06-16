import { describe, expect, jest, it, afterEach } from '@jest/globals';
import { Order } from '@commercetools/platform-sdk';
import { ReturnItemHelper } from '../../src/avalara/types/index.types';
import {
  extractRefundLines,
  extractReturnItems,
} from '../../src/avalara/helpers/refund.lines.helpers';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';

jest.mock('../../src/avalara/helpers/transaction.model.helpers');

describe('refund.lines.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractRefundLines', () => {
    it('should extract refund lines correctly', () => {
      const returnItems: ReturnItemHelper[] = [
        { itemCode: 'item1', quantity: 1 },
      ];
      const taxDocument: CreateTransactionModel = {
        lines: [
          { itemCode: 'item1', quantity: 2, amount: 200 },
          { itemCode: 'item2', quantity: 1, amount: 100 },
        ],
      } as any;

      const result = extractRefundLines(returnItems, taxDocument);

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
