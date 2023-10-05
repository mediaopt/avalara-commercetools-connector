// set up avatax client configuration to be used in all calls to avalara

export function avaTaxConfig(env: string, httpClient: any) {
  return {
    appName: 'CommercetoolsConnector',
    appVersion: 'v1',
    machineName: 'vbl',
    environment: env,
    timeout: 5000,
    customHttpAgent: new httpClient.Agent({ keepAlive: true }),
    logOptions: {
      logEnabled: true, // toggle logging on or off, by default its off.
      logLevel: 3, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
      logRequestAndResponseInfo: true,
    },
  };
}
