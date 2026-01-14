import { getCustomer } from '../client/get.client';
import { CustomerWithEntityUseCode } from './types';

export async function extractCustomerWithEntityUseCode(
  customerId: string | undefined
) {
  if (!customerId)
    return { customerNumber: 'Guest' } as CustomerWithEntityUseCode;

  const customer = await getCustomer(customerId);
  return {
    customerNumber: customer?.customerNumber || customerId,
    exemptCode: customer?.custom?.fields?.avalaraEntityUseCode as string,
  } as CustomerWithEntityUseCode;
}
