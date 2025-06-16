import { Order } from '@commercetools/platform-sdk';
import { describe, expect, jest, it, afterEach } from '@jest/globals';

import { createOrderEdit, applyOrderEdit } from '../../src/client/post.client';
import {
  buildOrderEditUpdateActions,
  createAndApplyOrderEdit,
} from '../../src/avalara/helpers/order.edit.helpers';
import { order } from '../order.test.data';

jest.mock('../../src/client/post.client');

const mockCreateOrderEdit = createOrderEdit as jest.MockedFunction<
  typeof createOrderEdit
>;
const mockApplyOrderEdit = applyOrderEdit as jest.MockedFunction<
  typeof applyOrderEdit
>;

describe('order.edit.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createAndApplyOrderEdit', () => {
    it('should create and apply order edit successfully', async () => {
      const orderToBeEdited = order({
        orderNumber: '12345',
        country: 'US',
      }) as unknown as Order;
      const transactionModel: any = {
        summary: [{ rate: 0.0725 }],
        lines: [
          { itemCode: 'sku123', tax: 10 },
          { itemCode: '12345678909', tax: 10 },
          { itemCode: 'Shipping', tax: 10 },
        ],
      };
      const orderEdit: any = { id: 'order-edit-id' };

      mockCreateOrderEdit.mockResolvedValue(orderEdit);

      orderEdit.result = {
        type: 'Applied',
      };
      mockApplyOrderEdit.mockResolvedValue(orderEdit);

      const result = await createAndApplyOrderEdit(
        transactionModel,
        orderToBeEdited
      );

      expect(mockCreateOrderEdit).toHaveBeenCalledWith('123', [
        { action: 'changeTaxMode', taxMode: 'ExternalAmount' },
        {
          action: 'setLineItemTaxAmount',
          externalTaxAmount: {
            taxRate: { amount: 0.0725, country: 'US', name: 'avaTaxRate' },
            totalGross: { centAmount: 13300, currencyCode: 'USD' },
          },
          lineItemId: '123',
        },
        {
          action: 'setCustomLineItemTaxAmount',
          customLineItemId: '641649e5-2337-4871-90ab-164fd3e919b3',
          externalTaxAmount: {
            taxRate: { amount: 0.0725, country: 'US', name: 'avaTaxRate' },
            totalGross: { centAmount: 5200, currencyCode: 'USD' },
          },
        },
        {
          action: 'setShippingMethodTaxAmount',
          externalTaxAmount: {
            taxRate: { amount: 0.0725, country: 'US', name: 'avaTaxRate' },
            totalGross: { centAmount: 1123, currencyCode: 'USD' },
          },
          shippingKey: undefined,
        },
        {
          action: 'setOrderTotalTax',
          externalTotalGross: { centAmount: 27600, currencyCode: 'USD' },
        },
      ]);
      expect(mockApplyOrderEdit).toHaveBeenCalledWith(orderEdit);
      expect(result).toEqual(true);
    });
  });
  describe('buildOrderEditUpdateActions', () => {
    it('should build update actions for order edit', () => {
      const transactionModel: any = {
        summary: [{ rate: 0.0725 }],
        lines: [
          { itemCode: 'sku123', tax: 10 },
          { itemCode: '12345678909', tax: 10 },
          { itemCode: 'Shipping', tax: 10 },
        ],
      };
      const orderToBeEdited = order({
        orderNumber: '12345',
        country: 'US',
      }) as unknown as Order;

      const actions = buildOrderEditUpdateActions(
        transactionModel,
        orderToBeEdited
      );

      expect(actions).toEqual([
        {
          action: 'changeTaxMode',
          taxMode: 'ExternalAmount',
        },
        {
          action: 'setLineItemTaxAmount',
          externalTaxAmount: {
            taxRate: {
              amount: 0.0725,
              country: 'US',
              name: 'avaTaxRate',
            },
            totalGross: {
              centAmount: 13300,
              currencyCode: 'USD',
            },
          },
          lineItemId: '123',
        },
        {
          action: 'setCustomLineItemTaxAmount',
          customLineItemId: '641649e5-2337-4871-90ab-164fd3e919b3',
          externalTaxAmount: {
            taxRate: {
              amount: 0.0725,
              country: 'US',
              name: 'avaTaxRate',
            },
            totalGross: {
              centAmount: 5200,
              currencyCode: 'USD',
            },
          },
        },
        {
          action: 'setShippingMethodTaxAmount',
          externalTaxAmount: {
            taxRate: {
              amount: 0.0725,
              country: 'US',
              name: 'avaTaxRate',
            },
            totalGross: {
              centAmount: 1123,
              currencyCode: 'USD',
            },
          },
          shippingKey: undefined,
        },
        {
          action: 'setOrderTotalTax',
          externalTotalGross: {
            centAmount: 27600,
            currencyCode: 'USD',
          },
        },
      ]);
    });
  });
});
