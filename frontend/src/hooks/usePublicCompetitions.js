import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/publicApi';

export function usePublicCompetitions(params) {
  return useQuery({
    queryKey: ['publicCompetitions', params],
    queryFn: async () => (await publicApi.listPublicCompetitions(params)).data,
    placeholderData: keepPreviousData
  });
}

export function usePublicCompetitionDetail(slug) {
  return useQuery({
    queryKey: ['publicCompetition', slug],
    queryFn: async () => (await publicApi.getPublicCompetitionDetail(slug)).data.data,
    enabled: Boolean(slug)
  });
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ['publicCompetitionCategories'],
    queryFn: async () => (await publicApi.getPublicCategories()).data.data
  });
}
