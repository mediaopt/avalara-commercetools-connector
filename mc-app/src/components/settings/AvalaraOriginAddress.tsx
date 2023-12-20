import styles from './settings.module.css';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import TextInput from '@commercetools-uikit/text-input';
import PrimaryButton from '@commercetools-uikit/primary-button';
import { AvaTaxSettingsType, SettingsFormDataType } from '../../types/types';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
  NOTIFICATION_KINDS_PAGE,
} from '@commercetools-frontend/constants';
import { GRAPHQL_EXTENSION_KEY_NAME } from '../../constants';
import { useFetchUrlSettings } from '../connector-hooks/use-extensionUrl-connector';
import { useEffect } from 'react';

const AvalaraOriginAddress = ({ values, handleChange }: AvaTaxSettingsType) => {
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

  const checkAddress = async (values: SettingsFormDataType) => {
    const creds = {
      username: values.accountNumber,
      password: values.licenseKey,
    };
    if (!creds.username || !creds.password) {
      showNotification({
        kind: NOTIFICATION_KINDS_SIDE.warning,
        domain: DOMAINS.GLOBAL,
        text: 'No credentials specified!',
      });
      return;
    }

    const address = {
      line1: values.line1,
      line2: values.line2,
      line3: values.line3,
      city: values.city,
      postalCode: values.postalCode,
      region: values.region,
      country: values.country,
      textCase: 'mixed',
    };
    const response = await fetch(url + '/check-address', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        env: values?.env ? 'production' : 'sandbox',
        creds: creds,
        address: address,
        logging: {
          enabled: values.enableLogging,
          level: values.logLevel,
        },
      }),
    }).then((res) => res.json());
    if (response?.valid) {
      const suggested = [
        {
          value: address.line1 === response?.address[0]?.line1,
          key: 'line1',
          name: 'line 1',
        },
        {
          value: address.line2 === response?.address[0]?.line2,
          key: 'line2',
          name: 'line 2',
        },
        {
          value: address.line3 === response?.address[0]?.line3,
          key: 'line3',
          name: 'line 3',
        },
        {
          value: address.city === response?.address[0]?.city,
          key: 'city',
          name: 'city',
        },
        {
          value: address.region === response?.address[0]?.region,
          key: 'region',
          name: 'state',
        },
        {
          value: address.postalCode === response?.address[0]?.postalCode,
          key: 'postalCode',
          name: 'postal code',
        },
        {
          value: address.country === response?.address[0]?.country,
          key: 'country',
          name: 'country',
        },
      ].filter((x) => !x.value);
      const suggestedAddress = suggested
        .map((x) => ` ${x.name}: ${response?.address[0][x.key]},`)
        .reduce((acc, curr) => acc + curr, '')
        .slice(0, -1);
      showNotification({
        kind: NOTIFICATION_KINDS_PAGE.success,
        domain: DOMAINS.GLOBAL,
        text:
          'Your origin address is valid!' +
          `${
            suggested.length !== 0
              ? ` Suggested address changes:${suggestedAddress}`
              : ''
          }`,
      });
      return;
    } else if (response?.valid !== undefined) {
      for (const error of response?.errorMessages) {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.warning,
          domain: DOMAINS.GLOBAL,
          text: error?.details || 'Address validation error.',
        });
      }
      return;
    }
    showNotification({
      kind: NOTIFICATION_KINDS_SIDE.error,
      domain: DOMAINS.GLOBAL,
      text: 'Internal server error. Please check your credentials and environment.',
    });
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
            <Text.Headline as="h3" intlMessage={messages.originAddress} />
          </Spacings.Inline>
          <Spacings.Stack scale="m" alignItems="stretch">
            <Text.Body intlMessage={messages.line1} />
            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="line1"
                value={values.line1}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.line2} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="line2"
                value={values.line2}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.line3} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="line3"
                value={values.line3}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.postalCode} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="postalCode"
                value={values.postalCode}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.city} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="city"
                value={values.city}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.region} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="region"
                value={values.region}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Text.Body intlMessage={messages.country} />

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <TextInput
                id="country"
                value={values.country}
                onChange={handleChange}
              ></TextInput>
            </Spacings.Inline>

            <Spacings.Inline
              scale="xs"
              alignItems="center"
              justifyContent="flex-start"
            >
              <PrimaryButton
                label="Check address"
                onClick={() => checkAddress(values)}
              />
            </Spacings.Inline>
          </Spacings.Stack>
        </Spacings.Stack>
      </Spacings.Inset>
    </div>
  );
};

AvalaraOriginAddress.displayName = 'Avalara Origin Address';

export default AvalaraOriginAddress;
