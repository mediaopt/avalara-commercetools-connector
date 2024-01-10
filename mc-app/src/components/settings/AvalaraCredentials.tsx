import styles from './settings.module.css';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import PrimaryButton from '@commercetools-uikit/primary-button';
import { AvaTaxSettingsType } from '../../types/types';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import { GRAPHQL_EXTENSION_KEY_NAME } from '../../constants';
import { useFetchUrlSettings } from '../connector-hooks/use-extensionUrl-connector';
import { useEffect } from 'react';
import { useAsyncDispatch, actions } from '@commercetools-frontend/sdk';

const AvalaraCredentials = ({ values }: AvaTaxSettingsType) => {
  const showNotification = useShowNotification();
  const { url, error, loading } = useFetchUrlSettings(
    GRAPHQL_EXTENSION_KEY_NAME
  );
  const dispatch = useAsyncDispatch();
  async function testConnection() {
    try {
      const result = (await dispatch(
        actions.forwardTo.post({
          uri: url + '/test-connection',
          payload: {
            logging: {
              enabled: values.enableLogging,
              level: values.logLevel,
            },
          },
        })
      )) as { authenticated: boolean };
      if (result?.authenticated) {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.success,
          domain: DOMAINS.GLOBAL,
          text: 'Connection test successful! Your Avalara credentials are valid.',
        });
      } else {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.warning,
          domain: DOMAINS.GLOBAL,
          text: 'AvaTax service is available, but your credentials are invalid!',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.error,
          domain: DOMAINS.GLOBAL,
          text: 'Internal server error: ' + error.message,
        });
      } else {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.error,
          domain: DOMAINS.GLOBAL,
          text: 'Internal server error. Please contact support.',
        });
      }
    }
  }

  useEffect(() => {
    if (loading) {
      return;
    }
    if (error) {
      console.error(error);
    }
  }, [url, error, loading, dispatch]);

  return (
    <div className={styles.border}>
      <Spacings.Inset scale="m">
        <Spacings.Stack alignItems="stretch" scale="m">
          <Spacings.Inline
            scale="m"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Text.Headline as="h3" intlMessage={messages.connection} />
            <div></div>
          </Spacings.Inline>
          <Spacings.Stack scale="m" alignItems="stretch">
            <Text.Body intlMessage={messages.info} />
            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <PrimaryButton
                label="Test Connection"
                onClick={() => testConnection()}
              />
            </Spacings.Inline>
          </Spacings.Stack>
        </Spacings.Stack>
      </Spacings.Inset>
    </div>
  );
};

AvalaraCredentials.displayName = 'Avalara Credentials';

export default AvalaraCredentials;
