import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptions}
 */
const config = {
  name: 'Avalara - Tax calculation provider',
  description: 'Sales tax solution',
  entryPointUriPath,
  cloudIdentifier: 'gcp-eu',
  env: {
    development: {
      initialProjectKey: 'avalara-demo',
    },
    production: {
      applicationId: 'clopmlukv015wy20151a6kdox',
      url: 'http://yoururl.com',
    },
  },
  headers: {
      "csp": {
        "connect-src": ["*"],      
      }
    },
  oAuthScopes: {
    view: ['view_key_value_documents'],
    manage: ['manage_key_value_documents', 'manage_extensions'],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/stamp.svg}',
  mainMenuLink: {
    defaultLabel: 'Avalara Connector',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
  submenuLinks: [
    {
      uriPath: 'settings',
      defaultLabel: 'Settings',
      labelAllLocales: [],
      permissions: [PERMISSIONS.Manage],
    },
  ],
};

export default config;
