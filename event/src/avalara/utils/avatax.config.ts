// set up avatax client configuration to be used in all calls to avalara
import * as http from 'node:https';

export function avaTaxConfig(env: string, enabled?: boolean, level?: string) {
  return {
    appName: 'CommercetoolsbyMediaopt',
    appVersion: 'a0o5a000008TO2qAAG',
    machineName: 'v1',
    environment: env,
    timeout: 5000,
    customHttpAgent: new http.Agent({ keepAlive: true }),
    logOptions: {
      logEnabled: enabled ?? true, // toggle logging on or off, by default its off.
      logLevel: Number(level) ?? 3, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
      logRequestAndResponseInfo: true,
    },
  };
}
