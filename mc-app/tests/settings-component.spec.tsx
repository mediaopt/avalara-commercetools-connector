import {
  screen,
  mapResourceAccessToAppliedPermissions,
  type TRenderAppWithReduxOptions,
} from '@commercetools-frontend/application-shell/test-utils';
import { renderApplicationWithRedux } from '../src/test-utils';
import { entryPointUriPath, PERMISSIONS } from '../src/constants';
import ApplicationRoutes from '../src/routes';

const renderApp = (options: Partial<TRenderAppWithReduxOptions> = {}) => {
  const route = options.route || `/${entryPointUriPath}`;
  const { history } = renderApplicationWithRedux(<ApplicationRoutes />, {
    route,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions([
        PERMISSIONS.View,
      ]),
    },
    ...options,
  });
  return { history };
};

it('should render settings component', async () => {
  renderApp();
  await screen.findByText('Avalara Tax calculation');
});
