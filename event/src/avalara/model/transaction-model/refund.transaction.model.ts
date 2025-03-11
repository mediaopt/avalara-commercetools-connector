import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { TaxOverrideType } from 'avatax/lib/enums/TaxOverrideType';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import {
  convertTransactionLineItemModeltoLineItemModel,
  convertTransactionModelToCreateTransactionModel,
} from '../../helpers/transaction.model.helpers';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

export function refundTransactionModel(
  transaction: TransactionModel,
  companyCode: string
) {
  const taxDocument = new CreateOrAdjustTransactionModel();

  taxDocument.createTransactionModel =
    convertTransactionModelToCreateTransactionModel(transaction, companyCode);

  taxDocument.createTransactionModel.referenceCode = 'Refund';

  taxDocument.createTransactionModel.type = DocumentType.ReturnInvoice;

  taxDocument.createTransactionModel.code = transaction.code + '-R';

  taxDocument.createTransactionModel.lines = transaction.lines
    ?.map(convertTransactionLineItemModeltoLineItemModel)
    .map((x) => {
      x.amount = -x.amount;
      return x;
    })
    .filter((x) => x.itemCode !== 'Shipping') as LineItemModel[];

  const taxModel = new TaxOverrideModel();

  taxModel.taxDate = transaction.taxDate;
  taxModel.type = TaxOverrideType.TaxDate;
  taxModel.reason = 'Refund';
  taxDocument.createTransactionModel.taxOverride = taxModel;

  return taxDocument;
}
