import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { AvataxMerchantConfig } from '../types/index.types';

export const setUpAvaTax = (settings: AvataxMerchantConfig, env: string) => {
  const originAddress = {
    line1: settings?.line1,
    line2: settings?.line2,
    line3: settings?.line3,
    city: settings?.city,
    postalCode: settings?.postalCode,
    region: settings?.region,
    country: settings?.country,
  };
  const avataxConfig = avaTaxConfig(
    env,
    settings?.enableLogging,
    settings?.logLevel
  );

  return { originAddress, avataxConfig };
};

function sanitizeString(str: string | undefined, sql_key: string) {
  if (str?.toLowerCase().startsWith(sql_key.toLowerCase())) {
    str = str.replace(sql_key, `\\ ${sql_key}`);
    str = str.replace(sql_key.toLowerCase(), `\\ ${sql_key.toLowerCase()}`);
  }
  return str;
}

export function sanitizeAddress(address: AddressInfo) {
  address.city = sanitizeString(address.city, 'Union');
  address.line1 = sanitizeString(address.line1, 'Union');
  address.line2 = sanitizeString(address.line2, 'Union');
  address.line3 = sanitizeString(address.line3, 'Union');
  return address;
}
