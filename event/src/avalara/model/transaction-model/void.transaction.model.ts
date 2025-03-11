import { VoidTransactionModel } from 'avatax/lib/models/VoidTransactionModel';
import { VoidReasonCode } from 'avatax/lib/enums/VoidReasonCode';
import { DocumentType } from 'avatax/lib/enums/DocumentType';

export function voidTransactionModel(orderId: string, companyCode: string) {
  const voidModel = new VoidTransactionModel();

  voidModel.code = VoidReasonCode.DocVoided;

  const voidBody = {
    companyCode: companyCode,
    transactionCode: orderId,
    documentType: DocumentType.SalesInvoice,
    model: voidModel,
  };

  return voidBody;
}
