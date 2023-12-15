import { jest } from '@jest/globals';
import {
  avalaraMerchantDataBody,
  bulkCategoryTaxCodeBody,
  bulkProductCategoriesBody,
  entityUseCodeBody,
  orderRequest,
  shipTaxCodeBody,
} from './test.data';

export const buildRequest: any = (
  requestType: string,
  orderNumber: string,
  disableDocRec: boolean,
  country: string
) => {
  switch (requestType) {
    case 'getData':
      return {
        execute: jest.fn(() => avalaraMerchantDataBody(disableDocRec)),
      };
    case 'getShipTaxCode':
      return {
        execute: jest.fn(() => shipTaxCodeBody('PC030000')),
      };
    case 'getCustomerEntityUseCode':
      return {
        execute: jest.fn(() => entityUseCodeBody('B')),
      };
    case 'getBulkCategoryTaxCode':
      return {
        execute: jest.fn(() =>
          bulkCategoryTaxCodeBody(['PS081282', 'PS080101'])
        ),
      };
    case 'getBulkProductCategories':
      return {
        execute: jest.fn(() => bulkProductCategoriesBody),
      };
    case 'getOrder':
      return {
        execute: jest.fn(() => orderRequest(orderNumber, country)),
      };
    default:
      return {
        execute: jest.fn(() => ({ body: { results: [{}] } })),
      };
  }
};

export const apiRoot: any = (
  build: CallableFunction = buildRequest,
  requestType: string,
  orderNumber: string,
  doRefund: boolean,
  disableDocRec: boolean,
  country: string
) => {
  return {
    testRoot: jest.fn(() => true), // use this parameter to throw "locked transaction error" for simulating refunds
    doRefund: jest.fn(() => doRefund), // use this parameter to throw "locked transaction error" for simulating refunds
    customObjects: jest.fn(() =>
      apiRoot(build, 'getData', orderNumber, doRefund, disableDocRec, country)
    ),
    shippingMethods: jest.fn(() =>
      apiRoot(
        build,
        'getShipTaxCode',
        orderNumber,
        doRefund,
        disableDocRec,
        country
      )
    ),
    customers: jest.fn(() =>
      apiRoot(
        build,
        'getCustomerEntityUseCode',
        orderNumber,
        doRefund,
        disableDocRec,
        country
      )
    ),
    categories: jest.fn(() =>
      apiRoot(
        build,
        'getBulkCategoryTaxCode',
        orderNumber,
        doRefund,
        disableDocRec,
        country
      )
    ),
    orders: jest.fn(() =>
      apiRoot(build, 'getOrder', orderNumber, doRefund, disableDocRec, country)
    ),
    productProjections: jest.fn(() =>
      apiRoot(
        build,
        'getBulkProductCategories',
        orderNumber,
        doRefund,
        disableDocRec,
        country
      )
    ),
    search: jest.fn(() =>
      apiRoot(build, requestType, orderNumber, doRefund, disableDocRec, country)
    ),
    withId: jest.fn(() =>
      apiRoot(build, requestType, orderNumber, doRefund, disableDocRec, country)
    ),
    withContainer: jest.fn(() =>
      apiRoot(build, requestType, orderNumber, doRefund, disableDocRec, country)
    ),
    get: jest.fn(() => build(requestType, orderNumber, disableDocRec, country)),
    post: jest.fn(() =>
      build(requestType, orderNumber, disableDocRec, country)
    ),
  };
};

export const apiRootCommit = (
  orderNumber: string,
  disableDocRec: boolean,
  country: string
) => {
  return apiRoot(
    buildRequest,
    'getProject',
    orderNumber,
    false,
    disableDocRec,
    country
  );
};

export const apiRootVoid = (
  orderNumber: string,
  disableDocRec: boolean,
  country: string
) => {
  return apiRoot(
    buildRequest,
    'getProject',
    orderNumber,
    false,
    disableDocRec,
    country
  );
};

export const apiRootRefund = (
  orderNumber: string,
  disableDocRec: boolean,
  country: string
) => {
  return apiRoot(
    buildRequest,
    'getProject',
    orderNumber,
    true,
    disableDocRec,
    country
  );
};
