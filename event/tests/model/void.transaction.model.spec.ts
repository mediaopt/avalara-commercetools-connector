import { VoidReasonCode } from 'avatax/lib/enums/VoidReasonCode';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { voidTransactionModel } from '../../src/avalara/model/transaction-model/void.transaction.model';
import { describe, expect, it } from '@jest/globals';

describe('voidTransactionModel', () => {
  it('should create a VoidTransactionModel with the correct properties', () => {
    const orderId = 'order-id';
    const companyCode = 'company-code';

    const result = voidTransactionModel(orderId, companyCode);

    expect(result).toEqual({
      companyCode: companyCode,
      transactionCode: orderId,
      documentType: DocumentType.SalesInvoice,
      model: {
        code: VoidReasonCode.DocVoided,
      },
    });
  });
});
