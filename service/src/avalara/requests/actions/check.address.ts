import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

export async function checkAddress(
  data: {
    creds: { [key: string]: string },
  address: AddressInfo,
  config: any
  }
) {
  const client = new AvaTaxClient(data?.config).withSecurity(data?.creds);

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
