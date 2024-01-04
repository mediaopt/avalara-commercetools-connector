import { AvaTaxSettingsType } from '../../types/types';
import styles from './settings.module.css';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import ToggleInput from '@commercetools-uikit/toggle-input';
import SelectField from '@commercetools-uikit/select-field';

const AvalaraConfiguration = ({ values, handleChange }: AvaTaxSettingsType) => {
  return (
    <div className={styles.border}>
      <Spacings.Inset scale="m">
        <Spacings.Stack alignItems="stretch" scale="m">
          <Spacings.Inline
            scale="m"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Text.Headline as="h3" intlMessage={messages.configuration} />
          </Spacings.Inline>
          <Spacings.Inline
            scale="s"
            alignItems="center"
            justifyContent="flex-start"
          >
            <ToggleInput
              isDisabled={false}
              isChecked={values.enableLogging}
              value="false"
              name="enableLogging"
              onChange={handleChange}
              size="big"
            />
            <Text.Body intlMessage={messages.enableLogging} />
          </Spacings.Inline>
          <Spacings.Stack scale="m" alignItems="stretch">
            <SelectField
              title="Choose your log level"
              value={values.logLevel}
              options={[
                { value: '0', label: 'Error' },
                { value: '1', label: 'Warn' },
                { value: '2', label: 'Info' },
                { value: '3', label: 'Debug' },
              ]}
              name="logLevel"
              onChange={handleChange}
            />

            <SelectField
              title="Tax calculation mode"
              value={values.taxCalculation}
              options={[
                { value: 'none', label: 'None' },
                { value: 'US', label: 'USA' },
                { value: 'CA', label: 'Canada' },
                { value: 'USCA', label: 'USA and Canada' },
              ]}
              name="taxCalculation"
              onChange={handleChange}
            />

            <Spacings.Inline
              scale="s"
              alignItems="center"
              justifyContent="flex-start"
            >
              <ToggleInput
                isDisabled={false}
                isChecked={values.displayPricesWithTax}
                value="false"
                name="displayPricesWithTax"
                onChange={handleChange}
                size="big"
              />
              <Text.Body intlMessage={messages.displayPricesWithTax} />
            </Spacings.Inline>

            <Spacings.Inline
              scale="s"
              alignItems="center"
              justifyContent="flex-start"
            >
              <ToggleInput
                isDisabled={false}
                isChecked={values.addressValidation}
                value="false"
                name="addressValidation"
                onChange={handleChange}
                size="big"
              />
              <Text.Body intlMessage={messages.addressValidation} />
            </Spacings.Inline>

            <Spacings.Inline
              scale="s"
              alignItems="center"
              justifyContent="flex-start"
            >
              <ToggleInput
                isDisabled={false}
                isChecked={values.disableDocRec}
                value="false"
                name="disableDocRec"
                onChange={handleChange}
                size="big"
              />
              <Text.Body intlMessage={messages.disableDocRec} />
            </Spacings.Inline>
          </Spacings.Stack>
        </Spacings.Stack>
      </Spacings.Inset>
    </div>
  );
};

AvalaraConfiguration.displayName = 'Avalara Configuration';

export default AvalaraConfiguration;
