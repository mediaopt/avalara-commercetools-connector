import styles from './settings.module.css';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import TextInput from '@commercetools-uikit/text-input';
import PrimaryButton from '@commercetools-uikit/primary-button';
import ToggleInput from '@commercetools-uikit/toggle-input';
import { AvaTaxSettingsType, SettingsFormDataType } from '../../types/types';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import { GRAPHQL_EXTENSION_KEY_NAME } from '../../constants';
import { useFetchUrlSettings } from '../connector-hooks/use-extensionUrl-connector';
import { useEffect } from 'react';

const AvalaraCredentials = ({ values, handleChange }: AvaTaxSettingsType) => {
  const { url, error, loading } = useFetchUrlSettings(
    GRAPHQL_EXTENSION_KEY_NAME
  );

  useEffect(() => {
    if (loading) {
      return;
    }
    if (error) {
      console.error(error);
    }
  }, [url, error, loading]);

  const showNotification = useShowNotification();

  const testConnection = async (values: SettingsFormDataType) => {
    const creds = {
      username: values.accountNumber,
      password: values.licenseKey,
    };

    const response = await fetch(url + '/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        env: values?.env ? 'production' : 'sandbox',
        creds: creds,
        logging: {
          enabled: values.enableLogging,
          level: values.logLevel,
        },
      }),
    })
      .then((res) => res.json())
      .catch((error) => {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.error,
          domain: DOMAINS.GLOBAL,
          text: `Internal server error: ${JSON.stringify(error)}`,
        });
      });
    if (response?.authenticated) {
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
  };

  return (
    <div className={styles.border}>
      <Spacings.Inset scale="m">
        <Spacings.Stack alignItems="stretch" scale="m">
          <Spacings.Inline
            scale="m"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Text.Headline as="h3" intlMessage={messages.settings} />
            <div></div>
          </Spacings.Inline>
          <Spacings.Stack scale="m" alignItems="stretch">
            <Text.Body intlMessage={messages.account} />
            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="accountNumber"
                value={values.accountNumber}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.licenseKey} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="licenseKey"
                value={values.licenseKey}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.companyCode} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="companyCode"
                value={values.companyCode}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Spacings.Inline
              scale="s"
              alignItems="center"
              justifyContent="flex-start"
            >
              <ToggleInput
                isDisabled={false}
                isChecked={values.env}
                value="false"
                name="env"
                onChange={handleChange}
                size="big"
              />
              <Text.Body intlMessage={messages.env} />
            </Spacings.Inline>

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <PrimaryButton
                label="Test Connection"
                onClick={() => testConnection(values)}
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
