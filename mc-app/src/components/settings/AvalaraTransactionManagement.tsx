/* eslint-disable  @typescript-eslint/no-explicit-any */
import { AvaTaxSettingsType } from '../../types/types';
import styles from './settings.module.css';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import DataTable, { TColumn } from '@commercetools-uikit/data-table';
import CheckboxInput from '@commercetools-uikit/checkbox-input';
import { useEffect, useState } from 'react';
import { useFetchOrderState } from '../connector-hooks/use-state-connector';
import ToggleInput from '@commercetools-uikit/toggle-input';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
  NOTIFICATION_KINDS_PAGE,
} from '@commercetools-frontend/constants';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';

const AvalaraTransactionManagement = ({
  values,
  handleChange,
}: AvaTaxSettingsType) => {
  const showNotification = useShowNotification();

  const [checkedCommitRowsState, setCheckedCommitRowsState] = useState<
    Record<string, boolean>
  >({});
  const [checkedCancelRowsState, setCheckedCancelRowsState] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const commitOrderStates = values.commitOrderStates?.reduce((acc, id) => {
      return { ...acc, [id]: true };
    }, {});
    setCheckedCommitRowsState(commitOrderStates || {});
  }, [values.commitOrderStates]);

  useEffect(() => {
    const cancelOrderStates = values.cancelOrderStates?.reduce((acc, id) => {
      return { ...acc, [id]: true };
    }, {});
    setCheckedCancelRowsState(cancelOrderStates || {});
  }, [values.cancelOrderStates]);

  const orderStateColumns = [
    { key: 'state', label: 'Order State' },
    { key: 'type', label: 'Type' },
  ];

  const orderCommitStateRows = [
    { id: 'confirmed', checkbox: '', state: 'Confirmed', type: 'General' },
    { id: 'complete', checkbox: '', state: 'Complete', type: 'General' },
  ];

  const orderCancelStateRows = [
    { id: 'cancelled', checkbox: '', state: 'Cancelled', type: 'General' },
  ];
  const { states, error, loading } = useFetchOrderState();

  if (error) {
    showNotification({
      domain: DOMAINS.GLOBAL,
      kind: NOTIFICATION_KINDS_PAGE.error,
      text:
        'Could not load transaction management with error: ' + error.message,
    });
    return null;
  }

  const commitRows = orderCommitStateRows.concat(
    states.map((state) => ({
      id: state.id,
      checkbox: '',
      state: state.name,
      type: 'Workflow',
    }))
  );

  const cancelRows = orderCancelStateRows.concat(
    states.map((state) => ({
      id: state.id,
      checkbox: '',
      state: state.name,
      type: 'Workflow',
    }))
  );
  const tableOrderCommitStateColumns = [
    {
      key: 'checkbox',
      label: '',
      shouldIgnoreRowClick: true,
      align: 'center',
      renderItem: (row: any) => (
        <CheckboxInput
          isChecked={checkedCommitRowsState[row.id]}
          onChange={() => {
            setCheckedCommitRowsState((obj) => {
              const newState: any = { ...obj, [row.id]: !obj[row.id] };
              if (checkedCancelRowsState[row.id]) {
                return showNotification({
                  domain: DOMAINS.GLOBAL,
                  kind: NOTIFICATION_KINDS_SIDE.error,
                  text: 'This order state is already selected for cancel',
                });
              } else if (newState[row.id]) {
                if (!values?.commitOrderStates) {
                  values.commitOrderStates = [];
                } else {
                  values.commitOrderStates.push(row.id);
                }
              } else {
                values.commitOrderStates = values?.commitOrderStates.filter(
                  (id) => id !== row.id
                );
              }
              return newState;
            });
          }}
        />
      ),
      disableResizing: true,
    },
    ...(orderStateColumns || []),
  ] as TColumn[];

  const tableOrderCancelStateColumns = [
    {
      key: 'checkbox',
      label: '',
      shouldIgnoreRowClick: true,
      align: 'center',
      renderItem: (row: any) => (
        <CheckboxInput
          isChecked={checkedCancelRowsState[row.id]}
          onChange={() => {
            setCheckedCancelRowsState((obj) => {
              const newState: any = { ...obj, [row.id]: !obj[row.id] };
              if (newState[row.id]) {
                if (checkedCommitRowsState[row.id]) {
                  return showNotification({
                    domain: DOMAINS.GLOBAL,
                    kind: NOTIFICATION_KINDS_SIDE.error,
                    text: 'This order state is already selected for commit',
                  });
                } else if (!values?.cancelOrderStates) {
                  values.cancelOrderStates = [];
                } else {
                  values.cancelOrderStates.push(row.id);
                }
              } else {
                values.cancelOrderStates = values?.cancelOrderStates.filter(
                  (id) => id !== row.id
                );
              }
              return newState;
            });
          }}
        />
      ),
      disableResizing: true,
    },
    ...(orderStateColumns || []),
  ] as TColumn[];

  return (
    <div className={styles.border}>
      <Spacings.Inset scale="m">
        <Spacings.Stack alignItems="stretch" scale="m">
          <Spacings.Inline
            scale="m"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Text.Headline
              as="h3"
              intlMessage={messages.transactionManagement}
            />
          </Spacings.Inline>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Spacings.Inline
                scale="s"
                alignItems="center"
                justifyContent="flex-start"
              >
                <ToggleInput
                  isDisabled={false}
                  isChecked={values.commitOnOrderCreation}
                  value="false"
                  name="commitOnOrderCreation"
                  onChange={handleChange}
                  size="big"
                />
                <Text.Body intlMessage={messages.commitOnOrderCreation} />
              </Spacings.Inline>
              {!values.commitOnOrderCreation && (
                <>
                  <Spacings.Inline
                    scale="m"
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Text.Subheadline
                      as="h5"
                      intlMessage={messages.transactionCommit}
                    />
                  </Spacings.Inline>
                  <Spacings.Inline
                    scale="s"
                    alignItems="center"
                    justifyContent="flex-start"
                  >
                    <DataTable
                      onRowClick={handleChange}
                      rows={commitRows}
                      columns={tableOrderCommitStateColumns}
                    />
                  </Spacings.Inline>
                </>
              )}
              <Spacings.Inline
                scale="s"
                alignItems="center"
                justifyContent="flex-start"
              >
                <ToggleInput
                  isDisabled={false}
                  isChecked={values.cancelOnOrderCancelation}
                  value="false"
                  name="cancelOnOrderCancelation"
                  onChange={handleChange}
                  size="big"
                />
                <Text.Body intlMessage={messages.cancelOnOrderCancelation} />
              </Spacings.Inline>
              {!values.cancelOnOrderCancelation && (
                <>
                  <Spacings.Inline
                    scale="m"
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Text.Subheadline
                      as="h5"
                      intlMessage={messages.transactionCancel}
                    />
                  </Spacings.Inline>
                  <Spacings.Inline
                    scale="s"
                    alignItems="center"
                    justifyContent="flex-start"
                  >
                    <DataTable
                      onRowClick={handleChange}
                      rows={cancelRows}
                      columns={tableOrderCancelStateColumns}
                    />
                  </Spacings.Inline>
                </>
              )}
            </>
          )}
        </Spacings.Stack>
      </Spacings.Inset>
    </div>
  );
};

AvalaraTransactionManagement.displayName = 'Avalara Transaction Management';

export default AvalaraTransactionManagement;
