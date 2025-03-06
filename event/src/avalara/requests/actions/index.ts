import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import {
  refundTransaction,
  voidTransaction,
} from './void.or.refund.transaction';
import {
  adjustTransactionLines,
  refundTransactionLines,
} from './adjust.or.refund.transaction.lines';
import { commitTransaction } from './commit.transaction';

export async function adjustOrRefundTransactionLines(
  returnItemId: string,
  orderId: string,
  creds: { [key: string]: string },
  originAddress: any,
  config: any
) {
  try {
    await adjustTransactionLines(
      returnItemId,
      orderId,
      creds,
      originAddress,
      config
    );
  } catch (error: any) {
    if (error?.code === 'CannotModifyLockedTransaction') {
      await refundTransactionLines(
        returnItemId,
        orderId,
        creds,
        originAddress,
        config
      );
    }
  }
}

export async function voidOrRefundTransaction(
  orderId: string,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any
) {
  try {
    await voidTransaction(orderId, creds, config);
  } catch (error: any) {
    if (error?.code === 'CannotModifyLockedTransaction') {
      await refundTransaction(orderId, creds, originAddress, config);
    }
  }
}

module.exports = {
  adjustOrRefundTransactionLines,
  voidOrRefundTransaction,
  commitTransaction,
};
