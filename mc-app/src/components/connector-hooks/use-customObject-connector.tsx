import { useMutation, useQuery } from '@apollo/client';
import FETCH_SETTINGS from '../../queries/FetchCustomObjectQuery.graphql';
import SET_SETTINGS from '../../mutations/UpdateCustomObjectMutation.graphql';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { FetchedCustomObjectType } from '../../types/types';

export const useFetchSettings = (key: string, container: string) => {
  const { data, error, loading } = useQuery(FETCH_SETTINGS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    variables: {
      key,
      container,
    },
  });
  return {
    customObject: (data?.customObject as FetchedCustomObjectType) || undefined,
    error,
    loading,
  };
};

export const useSetSettings = () => {
  const [setSettingsFunc, { data, error, loading }] = useMutation(
    SET_SETTINGS,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  return [
    setSettingsFunc,
    {
      createOrUpdateCustomObject:
        (data?.createOrUpdateCustomObject as FetchedCustomObjectType) ||
        undefined,
      error,
      loading,
    },
  ];
};
