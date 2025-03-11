// convert TransactionModel to CreateTransactionModel
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { AddressesModel } from 'avatax/lib/models/AddressesModel';
import { AddressLocationInfo } from 'avatax/lib/models/AddressLocationInfo';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { TransactionAddressModel } from 'avatax/lib/models/TransactionAddressModel';
import { TransactionLineModel } from 'avatax/lib/models/TransactionLineModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';

export function convertTransactionModelToCreateTransactionModel(
  transaction: TransactionModel,
  companyCode: string
): CreateTransactionModel {
  return {
    code: transaction.code,
    lines: transaction.lines?.map(
      convertTransactionLineItemModeltoLineItemModel
    ) as LineItemModel[],
    type: transaction.type,
    companyCode,
    date: transaction.date || new Date(),
    salespersonCode: transaction.salespersonCode,
    customerCode: transaction.customerCode || 'Guest',
    customerUsageType: transaction.customerUsageType,
    entityUseCode: transaction.entityUseCode,
    purchaseOrderNo: transaction.purchaseOrderNo,
    businessIdentificationNo: transaction.businessIdentificationNo,
    currencyCode: transaction.currencyCode,
    exchangeRate: transaction.exchangeRate,
    exchangeRateEffectiveDate: transaction.exchangeRateEffectiveDate,
    description: transaction.description,
    email: transaction.email,
    reportingLocationCode: transaction.reportingLocationCode,
    commit: true,
    batchCode: transaction.batchCode,
    parameters: transaction.parameters,
    addresses: extractAddressesFromTransactionModel(transaction),
    referenceCode: transaction.referenceCode,
  };
}

export function convertTransactionLineItemModeltoLineItemModel(
  transactionLine: TransactionLineModel
): LineItemModel {
  return {
    number: transactionLine.lineNumber,
    quantity: transactionLine.quantity,
    amount: transactionLine.lineAmount as number,
    taxCode: transactionLine.taxCode,
    itemCode: transactionLine.itemCode,
    taxIncluded: transactionLine.taxIncluded,
    parameters: transactionLine.parameters,
    description: transactionLine.description,
    businessIdentificationNo: transactionLine.businessIdentificationNo,
  };
}

export function extractAddressesFromTransactionModel(
  transaction: TransactionModel
): AddressesModel {
  const shipFrom = transaction.addresses?.find(
    (x: TransactionAddressModel) => x.id === transaction.originAddressId
  );
  const shipTo = transaction.addresses?.find(
    (x: TransactionAddressModel) => x.id === transaction.destinationAddressId
  );
  return {
    shipFrom: convertTransactionAddressModelToAddressLocationInfo(
      shipFrom as TransactionAddressModel
    ),
    shipTo: convertTransactionAddressModelToAddressLocationInfo(
      shipTo as TransactionAddressModel
    ),
  };
}

export function convertTransactionAddressModelToAddressLocationInfo(
  transactionAddress: TransactionAddressModel
): AddressLocationInfo {
  return {
    line1: transactionAddress?.line1,
    line2: transactionAddress?.line2,
    line3: transactionAddress?.line3,
    city: transactionAddress?.city,
    region: transactionAddress?.region,
    country: transactionAddress?.country,
    postalCode: transactionAddress?.postalCode,
  };
}

export function extractSalesInvoiceTransaction(
  transactions: TransactionModel[],
  orderId: string
) {
  return transactions.find(
    (transaction: any) =>
      transaction.type === 'SalesInvoice' && transaction.code === orderId
  );
}

export function extractUnlockedReturnTransactionAndCount(
  transactions: TransactionModel[],
  orderId: string
) {
  const returnTransactions = transactions.filter(
    (transaction: any) =>
      transaction.type === "ReturnInvoice" &&
      transaction.code?.includes(orderId + '-R')
  );
  const unlockedReturnTransaction = returnTransactions.find(
    (transaction) => !transaction.locked
  );
  return {
    returnTransactionsCount: returnTransactions.length,
    unlockedReturnTransaction,
  };
}
