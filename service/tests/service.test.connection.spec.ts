import { describe, expect, test, jest, afterEach } from '@jest/globals';
import { postTestConnection } from '../src/controllers/test.connection.controller';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../src/errors/custom.error';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import * as http from 'node:https';
import { PingResultModel } from 'avatax/lib/models/PingResultModel';

const response = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;

describe('test test connection controller', () => {
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
    expect(SpyAvatax).toHaveBeenCalledWith({
      appName: 'CommercetoolsbyMediaopt',
      appVersion: 'a0o5a000008TO2qAAG',
      customHttpAgent: expect.any(http.Agent),
      environment: process.env.AVALARA_ENV,
      logOptions: {
        logEnabled: true, // toggle logging on or off, by default its off.
        logLevel: 2, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
        logRequestAndResponseInfo: true,
      },
      machineName: 'v1',
      timeout: 5000,
    });

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
