import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { avaTaxConfig } from '../../utils/avatax.config';

export async function testConnection(data: any) {
  const config = avaTaxConfig(data?.env);
  const client = new AvaTaxClient(config).withSecurity(data?.creds);

  return await client.ping().then((res) => res.authenticated);
}
