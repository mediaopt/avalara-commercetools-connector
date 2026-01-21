import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { extractReturnItems } from './helpers/refund.lines.helpers';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { Order } from '@commercetools/platform-sdk';
import { logger } from '../utils/logger.utils';
import {
  createTransactionModel,
  voidTransactionModel,
  refundTransactionModel,
  refundTransactionLinesModel,
} from './model';

import {
  extractSalesInvoiceTransaction,
  extractReturnTransactionCount,
} from './helpers/transaction.model.helpers';
import { ReturnItemHelper } from './types/index.types';
import { createAndApplyOrderEdit } from './helpers/order.edit.helpers';
import { getYearAgoDate } from './helpers/utility.helpers';

export class AvataxTransactionManager {
  client: AvaTaxClient;
  companyCode: string;
  originAddress: AddressInfo;

  constructor(
    client: AvaTaxClient,
    companyCode: string,
    originAddress: AddressInfo
  ) {
    this.client = client;
    this.companyCode = companyCode;
    this.originAddress = originAddress;
  }

  async getRelatedTransactions(
    transactionCode: string
  ): Promise<TransactionModel[]> {
    const listTransactionsResponse =
      await this.client.listTransactionsByCompany({
        companyCode: this.companyCode,
        filter: `code startsWith '${transactionCode}' AND date ge '${getYearAgoDate()}'`,
        include: 'lines, addresses, details, summary',
      });

    return listTransactionsResponse.value;
  }

  async commitTransaction(order: Order) {
    return await this.client.createTransaction({
      model: await createTransactionModel(order, this, {
        commit: true,
      }),
    });
  }

  async voidTransaction(transactionCode: string) {
    return await this.client.voidTransaction(
      voidTransactionModel(transactionCode, this.companyCode)
    );
  }

  async refundTransaction(transaction: TransactionModel) {
    return await this.client.createTransaction({
      model: refundTransactionModel(transaction, this.companyCode),
    });
  }

  async refundTransactionLines(
    returnItems: ReturnItemHelper[],
    salesInvoiceTransaction: TransactionModel,
    returnTransactionsCount: number
  ) {
    return await this.client.createTransaction({
      model: refundTransactionLinesModel(
        returnItems,
        salesInvoiceTransaction,
        returnTransactionsCount,
        this.companyCode
      ),
    });
  }

  async voidOrRefundTransaction(order: Order) {
    const transactionCode = order.orderNumber ?? order.id;

    const relatedTransactions =
      await this.getRelatedTransactions(transactionCode);

    const salesInvoiceTransaction = extractSalesInvoiceTransaction(
      relatedTransactions,
      transactionCode
    );

    if (!salesInvoiceTransaction) {
      logger.info(
        `No sales invoice transaction for order number: ${transactionCode} found, no refund is possible`
      );
      return;
    }

    if (!salesInvoiceTransaction?.locked) {
      await this.voidTransaction(transactionCode);
    } else {
      const returnTransactionsCount = extractReturnTransactionCount(
        relatedTransactions,
        transactionCode
      );
      if (!returnTransactionsCount) {
        await this.refundTransaction(salesInvoiceTransaction);
      } else {
        logger.info(
          `The transaction ${transactionCode} has already been completely or partially refunded.`
        );
      }
    }
  }

  async partiallyRefundTransaction(returnItemId: string, order: Order) {
    const transactionCode = order.orderNumber ?? order.id;

    const returnItems = extractReturnItems(order, returnItemId);

    if (!returnItems || (returnItems && returnItems.length === 0)) {
      logger.info('No return items found');
      return;
    }

    const relatedTransactions =
      await this.getRelatedTransactions(transactionCode);

    const salesInvoiceTransaction = extractSalesInvoiceTransaction(
      relatedTransactions,
      transactionCode
    );

    if (!salesInvoiceTransaction) {
      logger.info(
        `No sales invoice transaction for order number: ${transactionCode} found, no refund is possible`
      );
      return;
    }

    const returnTransactionsCount = extractReturnTransactionCount(
      relatedTransactions,
      transactionCode
    );

    await this.refundTransactionLines(
      returnItems,
      salesInvoiceTransaction,
      returnTransactionsCount
    );
  }
  async recalculateTransaction(order: Order): Promise<void> {
    const recalculatedTransaction = await this.client.createTransaction({
      model: await createTransactionModel(order, this, {
        commit: false,
      }),
    });

    await createAndApplyOrderEdit(recalculatedTransaction, order);
  }
}
