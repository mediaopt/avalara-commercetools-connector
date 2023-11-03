import { describe, expect, test, jest} from '@jest/globals';
import { postTestConnection, testConnectionController } from '../src/controllers/test.connection.controller'
import { PingResultModel } from 'avatax/lib/models/PingResultModel';
import { Request, Response } from 'express';

const cases = [
  {
    result: true,
    requestBody: {
      env: process.env.AVALARA_ENV!,
      creds: {
        username: process.env.AVALARA_USERNAME!,
        password: process.env.AVALARA_PASSWORD!,
      },
    },
  },
  {
    result: false,
    requestBody: {
      env: 'sandbox',
      creds: {
        username: 'false',
        password: 'test',
      },
    },
  }
]

const expectUserAuthorization = (
  response:
  | PingResultModel
  | undefined, 
  result: boolean
) => {
  expect(response).toBeDefined();
  expect(response?.authenticated).toBe(result);
}

const expectSuccessfulCall = async (
  request: Request, 
  response: Response, 
  next: any
) => {
  await postTestConnection(request, response, next);
  expect(next).toBeCalledTimes(0);
}

const expectFailingCall = async (
  request: Request, 
  response: Response, 
  next: any
) => {
  await postTestConnection(request, response, next);
  expect(next).toBeCalledTimes(1);
}

describe('Connection test response', () => {
  test.each(cases)
  ('Validate connection test responses', async ({ requestBody, result }) => {
    const testResponse = await testConnectionController(requestBody)
    expectUserAuthorization(testResponse, result)
  });
});

describe('Connection test valid call', () => {
  test.each(cases)
  ('Check that connection test calls behave as expected', async ({requestBody}) => {
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

describe('Connection test invalid call', () => {
  test.each([{
    requestBody: {
    },
  }])
  ('Check that connection test calls behave as expected', async ({requestBody}) => {
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