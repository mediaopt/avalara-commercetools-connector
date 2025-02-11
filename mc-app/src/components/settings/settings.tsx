/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Formik } from 'formik';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import AvalaraCredentials from './AvalaraCredentials';
import AvalaraOriginAddress from './AvalaraOriginAddress';
import AvalaraConfiguration from './AvalaraConfiguration';
import {
  useFetchSettings,
  useSetSettings,
} from '../connector-hooks/use-customObject-connector';
import { useEffect, useState } from 'react';
import { SettingsFormDataType } from '../../types/types';
import {
  GRAPHQL_CUSTOMOBJECT_CONTAINER_NAME,
  GRAPHQL_CUSTOMOBJECT_KEY_NAME,
} from '../../constants';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import AvalaraTransactionManagement from './AvalaraTransactionManagement';

const DEFAULT = {
  logLevel: '0',
  addressValidation: true,
  disableDocRec: false,
  taxCalculation: 'USCA',
  enableLogging: true,
  displayPricesWithTax: true,
  line1: '',
  line2: '',
  line3: '',
  postalCode: '',
  city: '',
  region: '',
  country: '',
};

const Settings = () => {
  const showNotification = useShowNotification();
  const [isReady, setIsReady] = useState<boolean>(false);
  const [customObjectVersion, setCustomObjectVersion] = useState<number>();
  const [settingsObject, setSettingsObject] = useState<SettingsFormDataType>();
  const { customObject, error, loading } = useFetchSettings(
    GRAPHQL_CUSTOMOBJECT_KEY_NAME,
    GRAPHQL_CUSTOMOBJECT_CONTAINER_NAME
  );
  const [setSettingsFunc] = useSetSettings();

  const saveSettings = async (values: SettingsFormDataType) => {
    try {
      const result: any = await setSettingsFunc({
        variables: {
          draftOfCustomObject: {
            container: GRAPHQL_CUSTOMOBJECT_CONTAINER_NAME,
            key: GRAPHQL_CUSTOMOBJECT_KEY_NAME,
            version: customObjectVersion,
            value: JSON.stringify(values),
          },
        },
      });
      setCustomObjectVersion(result.data?.createOrUpdateCustomObject.version);
      setSettingsObject(result.data?.createOrUpdateCustomObject.value);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }
    if (error) {
      console.error(error);
    } else {
      setCustomObjectVersion(customObject?.version);
      setSettingsObject(customObject?.value || DEFAULT);
    }
  }, [customObject, error, loading]);

  useEffect(() => {
    setIsReady(settingsObject !== undefined);
  }, [settingsObject]);

  if (!isReady) {
    return <></>;
  }

  return (
    <Formik
      initialValues={customObject?.value || DEFAULT}
      onSubmit={(values) => {
        saveSettings(values);
      }}
    >
      {({ values, handleChange, handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <Spacings.Stack alignItems="stretch" scale="xl">
            <AvalaraCredentials values={values} handleChange={handleChange} />
            <AvalaraConfiguration values={values} handleChange={handleChange} />
            <AvalaraTransactionManagement
              values={values}
              handleChange={handleChange}
            />
            <AvalaraOriginAddress values={values} handleChange={handleChange} />
            <Spacings.Inline
              scale="s"
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <PrimaryButton
                label="Save configuration"
                type="submit"
                onClick={() => {
                  showNotification({
                    kind: NOTIFICATION_KINDS_SIDE.success,
                    domain: DOMAINS.GLOBAL,
                    text: 'Your data was saved!',
                  });
                }}
              />
            </Spacings.Inline>
          </Spacings.Stack>
        </form>
      )}
    </Formik>
  );
};
Settings.displayName = 'Settings Overview';

export default Settings;
