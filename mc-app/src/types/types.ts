import { ChangeEvent } from 'react';

export type SettingsFormDataType = {
  accountNumber: string;
  licenseKey: string;
  companyCode: string;
  env: boolean;
  logLevel: 'error' | 'debug' | 'info';
  addressValidation: boolean;
  disableDocRec: boolean;
  taxCalculation: 'none' | 'US' | 'CA' | 'USCA';
  line1: string;
  line2: string;
  line3: string; 
  postalCode: string; 
  city: string; 
  region: string; 
  country: string;
};

export type AvaTaxSettingsType = {
  values: SettingsFormDataType;
  handleChange: {
    (e: ChangeEvent<any>): void;
    <T = string | ChangeEvent<any>>(field: T): T extends ChangeEvent<any>
      ? void
      : (e: string | ChangeEvent<any>) => void;
  };
};

export type FetchedCustomObjectType = {
  value: SettingsFormDataType;
  version: number;
};

 export type FetchedExtensionUrlType= {
  url: string
};

export type ApollonFetchedCustomObjectType = {
  data: {
    createOrUpdateCustomObject: FetchedCustomObjectType;
  };
};
