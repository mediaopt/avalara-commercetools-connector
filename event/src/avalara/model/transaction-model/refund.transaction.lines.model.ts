import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { convertTransactionModelToCreateTransactionModel } from '../../helpers/transaction.model.helpers';
import { TaxOverrideType } from 'avatax/lib/enums/TaxOverrideType';
import { extractRefundLines } from '../../helpers/refund.lines.helpers';
import { ReturnItemHelper } from '../../types/index.types';

export function refundTransactionLinesModel(
  returnItems: ReturnItemHelper[],
  salesInvoiceTransaction: TransactionModel,
  returnTransactionsCount: number,
  companyCode: string
) {
  const taxDocument = convertTransactionModelToCreateTransactionModel(
    salesInvoiceTransaction,
    companyCode
  );

  taxDocument.code = `${salesInvoiceTransaction.code}-R${
    returnTransactionsCount + 1
  }`;

  taxDocument.referenceCode = 'Refund';
  const taxModel = new TaxOverrideModel();
  taxModel.taxDate = salesInvoiceTransaction.taxDate;
  taxModel.type = TaxOverrideType.TaxDate;
  taxModel.reason = 'Refund';
  taxDocument.taxOverride = taxModel;
  taxDocument.lines = extractRefundLines(returnItems, taxDocument);

  return taxDocument;
}
