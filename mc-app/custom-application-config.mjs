import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';

const entryPointUriPath = '${env:UNIQUE_IDENTIFIER}';

const PERMISSIONS = entryPointUriPathToPermissionKeys(entryPointUriPath);

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptions}
 */
const config = {
  name: 'Avalara Tax Provider',
  description: 'Sales tax solution',
  entryPointUriPath: entryPointUriPath,
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    development: {
      initialProjectKey: 'avalara-demo',
    },
    production: {
      applicationId: '${env:APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
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
    defaultLabel: 'Avalara',
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
