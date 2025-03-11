import { AdjustmentReason } from 'avatax/lib/enums/AdjustmentReason';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { convertTransactionModelToCreateTransactionModel } from '../../helpers/transaction.model.helpers';
import { extractRemainingLines } from '../../helpers/refund.lines.helpers';
import { ReturnItemHelper } from '../../types/index.types';

export function adjustTransactionLinesModel(
  returnItems: ReturnItemHelper[],
  transaction: TransactionModel,
  companyCode: string
) {
  const taxDocument = new CreateOrAdjustTransactionModel();

  taxDocument.createTransactionModel =
    convertTransactionModelToCreateTransactionModel(transaction, companyCode);

  taxDocument.adjustmentReason = AdjustmentReason.ProductReturned;

  taxDocument.adjustmentDescription = 'Product Returned';

  taxDocument.createTransactionModel.lines = extractRemainingLines(
    returnItems,
    taxDocument
  );

  return taxDocument;
}
