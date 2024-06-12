import {
  describe,
  expect,
  test,
  jest,
  afterEach,
  beforeEach,
} from '@jest/globals';
import { postTestConnection } from '../src/controllers/test.connection.controller';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../src/errors/custom.error';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import { PingResultModel } from 'avatax/lib/models/PingResultModel';
import * as moduleAvataxConfig from '../src/avalara/utils/avatax.config';
import { config } from './test.data';

const response = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;

describe('test test connection controller', () => {
  beforeEach(() => {
    jest.spyOn(moduleAvataxConfig, 'avaTaxConfig').mockReturnValue(config);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    {} as Request,
    { body: {} } as Request,
    { body: { logging: {} } } as Request,
    { body: { logging: { enabled: true } } } as Request,
    { body: { logging: { level: '2' } } } as Request,
  ])('bad requests throw an error', async (request) => {
    const next = jest.fn() as NextFunction;
    await postTestConnection(request, response, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(
      new CustomError(400, 'Bad request: missing required data.')
    );
  });

  test('a valid request is made with an expected AvaTax configuration', async () => {
    const SpyAvatax = jest.spyOn(moduleAvaTax, 'default');
    await postTestConnection(
      {
        body: {
          logging: {
            enabled: true,
            level: '2',
          },
        },
      } as Request,
      response,
      jest.fn()
    );
    expect(SpyAvatax).toHaveBeenCalledWith(config);

    SpyAvatax.mockRestore();
  });

  test('valid credentials are authorized', async () => {
    const next = jest.fn();
    const spyPing = jest.spyOn(moduleAvaTax.default.prototype, 'ping');
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await postTestConnection(
      {
        body: {
          logging: {
            enabled: true,
            level: '2',
          },
        },
      } as Request,
      response,
      next
    );
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
    });
    expect(spyPing).toBeCalledTimes(1);
    const getPingresult = (): Promise<PingResultModel> =>
      spyPing.mock.results[0].value as Promise<PingResultModel>;
    const pingResult = await getPingresult();
    expect(pingResult.authenticated).toBe(true);
    expect(response.json).toBeCalledWith(pingResult);
    expect(response.status).toBeCalledWith(200);
    expect(next).toBeCalledTimes(0);
  });

  test('invalid credentials are unauthorized', async () => {
    process.env.AVALARA_USERNAME = 'test';
    process.env.AVALARA_PASSWORD = 'test';
    const next = jest.fn();
    const spyPing = jest.spyOn(moduleAvaTax.default.prototype, 'ping');
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await postTestConnection(
      {
        body: {
          logging: {
            enabled: true,
            level: '2',
          },
        },
      } as Request,
      response,
      next
    );
    expect(spyCreds).toBeCalledWith({
      username: 'test',
      password: 'test',
    });
    expect(spyPing).toBeCalledTimes(1);
    const getPingresult = (): Promise<PingResultModel> =>
      spyPing.mock.results[0].value as Promise<PingResultModel>;
    const pingResult = await getPingresult();
    expect(pingResult.authenticated).toBe(false);
    expect(response.json).toBeCalledWith(pingResult);
    expect(response.status).toBeCalledWith(200);
    expect(next).toBeCalledTimes(0);
  });
});
