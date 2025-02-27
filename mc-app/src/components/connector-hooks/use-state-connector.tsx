import { useQuery } from '@apollo/client';
import FETCH_SETTINGS from '../../queries/FetchStatesQuery.graphql';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { OrderStateType } from '../../types/types';

export const useFetchOrderState = (locale: string) => {
  const { data, error, loading } = useQuery(FETCH_SETTINGS, {
    variables: {
      locale
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });
  return {
    states: (data?.states?.results as OrderStateType[]) || [],
    error,
    loading,
  };
};
