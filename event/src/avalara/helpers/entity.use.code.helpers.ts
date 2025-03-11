import { getCustomer } from '../../client/data.client';
import { CustomerWithEntityUseCode } from '../types/index.types';

export async function extractEntityUseCode(customerId: string | undefined) {
  if (!customerId)
    return { customerNumber: 'Guest' } as CustomerWithEntityUseCode;

  const customer = await getCustomer(customerId);
  return {
    customerNumber: customer?.customerNumber || customerId,
    exemptCode: customer?.custom?.fields?.avalaraEntityUseCode as string,
  } as CustomerWithEntityUseCode;
}
