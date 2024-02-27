import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';

export const entryPointUriPath = 'avalara-connector';

export const PERMISSIONS = entryPointUriPathToPermissionKeys(entryPointUriPath);

export const GRAPHQL_CUSTOMOBJECT_CONTAINER_NAME = 'avalara-connector-settings';

export const GRAPHQL_CUSTOMOBJECT_KEY_NAME = 'settings';

export const GRAPHQL_EXTENSION_KEY_NAME =
  'avalara-connector-cartUpdateExtension';
