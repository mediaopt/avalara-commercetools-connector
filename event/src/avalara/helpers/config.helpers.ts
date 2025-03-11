// set up avatax client configuration to be used in all calls to avalara
import * as http from 'node:https';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { AvataxMerchantConfig } from '../types/index.types';

export function avaTaxConfig(env: string, enabled?: boolean, level?: string) {
  return {
    appName: 'CommercetoolsbyMediaopt',
    appVersion: 'a0o5a000008TO2qAAG',
    machineName: 'v1',
    environment: env,
    timeout: 10000,
    customHttpAgent: new http.Agent({ keepAlive: true }),
    logOptions: {
      logEnabled: !!enabled, // toggle logging on or off, by default its off.
      logLevel: Number(level) || 0, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
      logRequestAndResponseInfo: true,
    },
  };
}

export const extractOriginAddress = (settings: AvataxMerchantConfig) => {
  const originAddress = {
    line1: settings?.line1,
    line2: settings?.line2,
    line3: settings?.line3,
    city: settings?.city,
    postalCode: settings?.postalCode,
    region: settings?.region,
    country: settings?.country,
  };

  return originAddress as AddressInfo;
};
