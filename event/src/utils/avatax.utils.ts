import { avaTaxConfig } from '../avalara/utils/avatax.config';

export const setUpAvaTax = (settings: any, httpAgent: any) => {
  const creds = {
    username: settings.accountNumber,
    password: settings.licenseKey,
  };
  const originAddress = {
    line1: settings.line1,
    line2: settings.line2,
    line3: settings.line3,
    city: settings.city,
    postalCode: settings.postalCode,
    region: settings.region,
    country: settings.country,
  };
  const avataxConfig = avaTaxConfig(
    settings.env ? 'production' : 'sandbox',
    httpAgent
  );

  return { creds, originAddress, avataxConfig };
};
