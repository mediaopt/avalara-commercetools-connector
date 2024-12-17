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
