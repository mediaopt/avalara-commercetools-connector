import { describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const builder: any = {
  withProjectKey: jest.fn(() => builder),
  withClientCredentialsFlow: jest.fn(() => builder),
  withHttpMiddleware: jest.fn(() => builder),
  build: jest.fn(() => ({ client: true })),
};

const apiRoot: any = {
  withProjectKey: jest.fn(() => apiRoot),
};

jest.mock('@commercetools/sdk-client-v2', () => ({
  ClientBuilder: jest.fn(() => builder),
}));

jest.mock('@commercetools/platform-sdk', () => ({
  createApiBuilderFromCtpClient: jest.fn(() => apiRoot),
}));

jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('commercetools client configuration', () => {
  it('builds a client with the configured project and middleware options', async () => {
    const { createClient } = await import('../src/client/build.client');
    const { authMiddlewareOptions } = await import(
      '../src/middleware/auth.middleware'
    );
    const { httpMiddlewareOptions } = await import(
      '../src/middleware/http.middleware'
    );

    expect(createClient()).toEqual({ client: true });
    expect(builder.withProjectKey).toHaveBeenCalledWith('test-project');
    expect(builder.withClientCredentialsFlow).toHaveBeenCalledWith(
      authMiddlewareOptions
    );
    expect(builder.withHttpMiddleware).toHaveBeenCalledWith(
      httpMiddlewareOptions
    );
    expect(builder.build).toHaveBeenCalled();
  });

  it('configures the auth middleware from test environment values', async () => {
    const { authMiddlewareOptions } = await import(
      '../src/middleware/auth.middleware'
    );

    expect(authMiddlewareOptions).toMatchObject({
      host: 'https://auth.eu-central-1.aws.commercetools.com',
      projectKey: 'test-project',
      credentials: {
        clientId: '000000000000000000000000',
        clientSecret: '00000000000000000000000000000000',
      },
      scopes: ['test-scope'],
    });
  });

  it('creates and caches the commercetools API root', async () => {
    const { createApiRoot } = await import('../src/client/create.client');

    const first = createApiRoot();
    const second = createApiRoot();

    expect(first).toBe(apiRoot);
    expect(second).toBe(first);
    expect(apiRoot.withProjectKey).toHaveBeenCalledWith({
      projectKey: 'test-project',
    });
  });

  it('passes unauthorized requests to the next middleware', async () => {
    const { verifyJWT } = await import('../src/middleware/auth.middleware');
    const next = jest.fn();
    const request = { get: jest.fn(() => undefined) } as any;

    await verifyJWT(request, {} as any, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unauthorized' })
    );
  });

  it('verifies tokens signed with the frontend API key', async () => {
    const { verifyJWT } = await import('../src/middleware/auth.middleware');
    const decode = jest.spyOn(jwt, 'decode').mockReturnValue({
      header: {},
      payload: { iss: 'https://external.example.com' },
    } as any);
    const verify = jest.spyOn(jwt, 'verify').mockReturnValue({} as any);
    process.env.FRONTEND_API_KEY = 'frontend-key';
    const next = jest.fn();

    await verifyJWT(
      { get: () => 'Bearer external-token' } as any,
      {} as any,
      next
    );

    expect(decode).toHaveBeenCalledWith('external-token', { complete: true });
    expect(verify).toHaveBeenCalledWith('external-token', 'frontend-key');
    expect(next).toHaveBeenCalledTimes(1);
    delete process.env.FRONTEND_API_KEY;
  });

  it('verifies tokens issued by commercetools using JWKS', async () => {
    const { verifyJWT } = await import('../src/middleware/auth.middleware');
    jest.spyOn(jwt, 'decode').mockReturnValue({
      header: { kid: 'key-id' },
      payload: { iss: 'https://mc-api.europe-west1.gcp.commercetools.com' },
    } as any);
    const verify = jest.spyOn(jwt, 'verify').mockReturnValue({} as any);
    const getSigningKey: any = jest.fn(async () => ({
      getPublicKey: () => 'public-key',
    }));
    jest.mocked(jwksClient).mockReturnValue({ getSigningKey } as any);
    const next = jest.fn();

    await verifyJWT(
      { get: () => 'Bearer commercetools-token' } as any,
      {} as any,
      next
    );

    expect(getSigningKey).toHaveBeenCalledWith('key-id');
    expect(verify).toHaveBeenCalledWith('commercetools-token', 'public-key');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
