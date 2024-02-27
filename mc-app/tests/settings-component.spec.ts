import {
  screen,
  mapResourceAccessToAppliedPermissions,
  type TRenderAppWithReduxOptions,
} from '@commercetools-frontend/application-shell/test-utils';
import { renderApplicationWithRoutesAndRedux } from '../src/test-utils';
import { entryPointUriPath, PERMISSIONS } from '../src/constants';
import loadMessages from '../src/load-messages';

const renderAppWithRoutesAndRedux = (
  options: Partial<TRenderAppWithReduxOptions> = {}
) => {
  const route = options.route || `/${entryPointUriPath}`;
  renderApplicationWithRoutesAndRedux({
    route,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions([
        PERMISSIONS.View,
      ]),
    },
    ...options,
  });
};

it('should render settings component with routes and redux', async () => {
  const locale = 'en';
  const messages = await loadMessages(locale);
  renderAppWithRoutesAndRedux();
  await screen.findByText(messages['Welcome.title'].toString());
});
