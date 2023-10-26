import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { avaTaxConfig } from '../../utils/avatax.config';

export async function checkAddress(data: any) {
  const client = new AvaTaxClient(
    data?.config ?? avaTaxConfig(data?.env)
  ).withSecurity(data?.creds);

  const addressValidation = await client.resolveAddress(data?.address);

  const validatedAddress = addressValidation?.validatedAddresses;

  const messages: any = addressValidation?.messages;

  let error = false;

  messages ? (error = messages[0].severity === 'Error') : false;

  if (!error) {
    return {
      valid: true,
      address: validatedAddress,
    };
  }

  return {
    valid: false,
    errorMessage: messages[0]?.details,
  };
}
