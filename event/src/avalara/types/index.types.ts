export type AvataxMerchantConfig = {
  logLevel: string;
  addressValidation: boolean;
  disableDocRec: boolean;
  commitOnOrderCreation: boolean;
  cancelOnOrderCancelation: boolean;
  commitOrderStates: Array<string>;
  cancelOrderStates: Array<string>;
  activateReturns: boolean;
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

export type ReturnItemHelper = {
  itemCode: string;
  quantity: number;
};

export type CategoryWithTaxCode = {
  id: string;
  avalaraTaxCode: string;
};

export type ProductWithCategories = {
  sku: string;
  categories: Array<string>;
};

export type ProductWithCategoryTaxCode = {
  sku: string;
  taxCode?: string;
};

export type CustomerWithEntityUseCode = {
  customerNumber: string;
  entityUseCode?: string;
};
