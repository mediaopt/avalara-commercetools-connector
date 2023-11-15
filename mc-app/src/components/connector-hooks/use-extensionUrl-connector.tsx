import { useQuery } from '@apollo/client';
import FETCH_SETTINGS from '../../queries/FetchExtensionUrl.graphql';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { FetchedExtensionUrlType } from '../../types/types';

export const useFetchUrlSettings = (key: string) => {
  const { data, error, loading } = useQuery(FETCH_SETTINGS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    variables: {
      key,
    },
  });
  return {
    url:
      (data?.extension?.destination?.url as FetchedExtensionUrlType) ||
      undefined,
    error,
    loading,
  };
};
