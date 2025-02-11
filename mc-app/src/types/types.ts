/* eslint-disable  @typescript-eslint/no-explicit-any */
import { ChangeEvent } from 'react';

export type SettingsFormDataType = {
  logLevel: string;
  addressValidation: boolean;
  disableDocRec: boolean;
  commitOnOrderCreation: boolean;
  cancelOnOrderCancelation: boolean;
  commitOrderStates: Array<string>;
  cancelOrderStates: Array<string>;
  taxCalculation: string;
  enableLogging: boolean;
  displayPricesWithTax: boolean;
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

export type FetchedExtensionUrlType = {
  url: string;
};

export type OrderStateType = {
  id: string;
  key: string;
  name: string;
  type: string;
};

export type ApollonFetchedCustomObjectType = {
  data: {
    createOrUpdateCustomObject: FetchedCustomObjectType;
  };
};
