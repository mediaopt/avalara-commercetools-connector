import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { convertTransactionModelToCreateTransactionModel } from '../../helpers/transaction.model.helpers';
import { TaxOverrideType } from 'avatax/lib/enums/TaxOverrideType';
import {
  addRefundLines,
  extractRefundLines,
} from '../../helpers/refund.lines.helpers';
import { ReturnItemHelper } from '../../types/index.types';

export function refundTransactionLinesModel(
  returnItems: ReturnItemHelper[],
  salesInvoiceTransaction: TransactionModel,
  returnTransactionsCount: number,
  unlockedReturnTransaction: TransactionModel | undefined,
  companyCode: string
) {
  const taxDocument = new CreateOrAdjustTransactionModel();

  if (!returnTransactionsCount || !unlockedReturnTransaction) {
    taxDocument.createTransactionModel =
      convertTransactionModelToCreateTransactionModel(
        salesInvoiceTransaction,
        companyCode
      );

    taxDocument.createTransactionModel.code = `${salesInvoiceTransaction.code}-R${
      returnTransactionsCount + 1
    }`;

    taxDocument.createTransactionModel.referenceCode = 'Refund';
    const taxModel = new TaxOverrideModel();
    taxModel.taxDate = salesInvoiceTransaction.taxDate;
    taxModel.type = TaxOverrideType.TaxDate;
    taxModel.reason = 'Refund';
    taxDocument.createTransactionModel.taxOverride = taxModel;
    taxDocument.createTransactionModel.lines = extractRefundLines(
      returnItems,
      taxDocument
    );
  } else {
    taxDocument.createTransactionModel =
      convertTransactionModelToCreateTransactionModel(
        unlockedReturnTransaction,
        companyCode
      );

    taxDocument.createTransactionModel.lines = addRefundLines(
      returnItems,
      salesInvoiceTransaction,
      taxDocument
    );
  }

  return taxDocument;
}
