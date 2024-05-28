// set up avatax client configuration to be used in all calls to avalara
import * as http from 'node:https';

export function avaTaxConfig(
  env: string,
  enabled?: boolean,
  level?: string,
  timeout = 5000
) {
  return {
    appName: 'CommercetoolsbyMediaopt',
    appVersion: 'a0o5a000008TO2qAAG',
    machineName: 'v1',
    environment: env,
    timeout,
    customHttpAgent: new http.Agent({ keepAlive: true }),
    logOptions: {
      logEnabled: !!enabled, // toggle logging on or off, by default its off.
      logLevel: Number(level) || 0, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
      logRequestAndResponseInfo: true,
    },
  };
}
