export type Message = {
  code: string;
  message: string;
  referencedBy: string;
};

export type ValidatorCreator = (
  path: string[],
  message: Message,
  overrideConfig?: object
) => [string[], [[(o: object) => boolean, string, [object]]]];

export type ValidatorFunction = (o: object) => boolean;

export type Wrapper = (
  validator: ValidatorFunction
) => (value: object) => boolean;

export type AvataxMerchantConfig = {
  accountNumber: string;
  licenseKey: string;
  companyCode: string;
  env: boolean;
  logLevel: string;
  addressValidation: boolean;
  disableDocRec: boolean;
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
