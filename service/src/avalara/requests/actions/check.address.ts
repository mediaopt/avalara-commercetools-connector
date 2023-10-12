import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

export async function checkAddress(
  creds: { [key: string]: string },
  address: AddressInfo,
  config: any
) {
  const client = new AvaTaxClient(config).withSecurity(creds);

  const addressValidation = await client.resolveAddress(address);

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
