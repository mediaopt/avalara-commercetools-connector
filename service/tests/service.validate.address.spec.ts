import { describe, expect, test, jest } from '@jest/globals';
import { postCheckAddress, checkAddressController } from '../src/controllers/check.address.controller'
import { ValidatedAddressInfo } from 'avatax/lib/models/ValidatedAddressInfo';
import { Request, Response } from 'express';

const cases = [
  {
    result: true,
    requestBody: {
      creds: {
        username: process.env.AVALARA_USERNAME!,
        password: process.env.AVALARA_PASSWORD!,
      },
      env: process.env.AVALARA_ENV!,
      address: {
        line1: '2000 Main Street',
        city: 'Irvine',
        region: 'CA',
        country: 'US',
        postalCode: '92614',
      },
    },
  },
  {
    result: false,
    requestBody: {
      creds: {
        username: process.env.AVALARA_USERNAME!,
        password: process.env.AVALARA_PASSWORD!,
      },
      env: process.env.AVALARA_ENV!,
      address: {
        line1: '200043 Main Street',
        city: 'Irvine',
        region: 'CA',
        country: 'US',
        postalCode: '92614',
      },
    },
  },
];

const expectValidAddress = (
  response: {
    valid: boolean, 
    address?: ValidatedAddressInfo[] | undefined, 
    errorMessage?: any
  }
) => {
  expect(response.valid).toBeTruthy();
  expect(response.address).toBeDefined();
  expect(response.errorMessage).toBeUndefined();
}

const expectInvalidAddress = (
  response: {
    valid: boolean, 
    address?: ValidatedAddressInfo[] | undefined,
    errorMessage?: any
  }
) => {
  expect(response.valid).toBeFalsy();
  expect(response.errorMessage).toBeDefined();
  expect(response.address).toBeUndefined();
}

const expectSuccessfulCall = async (
  request: Request, 
  response: Response, 
  next: any
) => {
  await postCheckAddress(request, response, next);
  expect(next).toBeCalledTimes(0);
}

const expectFailingCall = async (
  request: Request, 
  response: Response, 
  next: any
) => {
  await postCheckAddress(request, response, next);
  expect(next).toBeCalledTimes(1);
}

describe('Check address responses', () => {
  test.each(cases)
  ('Validate check address responses', async ({ requestBody, result }) => {
    const checkResponse = await checkAddressController(requestBody)
    if (result) {
      expectValidAddress(checkResponse);
    } else {
      expectInvalidAddress(checkResponse);
    }
  });
});

describe('Check address valid call', () => {
  test.each(cases)
  ('Check that check address calls behave as expected', async ({requestBody}) => {
    await expectSuccessfulCall({
      body: requestBody
    } as unknown as Request, 
    {
      json: jest.fn(), 
      status: jest.fn().mockReturnThis(),
    } as unknown as Response, 
    jest.fn())
  })
});

describe('Check address invalid call', () => {
  test.each([{
    requestBody: {
    },
  }])
  ('Check that check address calls behave as expected', async ({requestBody}) => {
    await expectFailingCall(
      {} as Request, 
      {
        json: jest.fn(), 
        status: jest.fn().mockReturnThis(),
      } as unknown as Response,
      jest.fn()
    )
  })
});