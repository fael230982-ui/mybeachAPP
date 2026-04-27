import { Beach, BeachDetails, City } from '@/types/api';

import { apiRequest } from './api';

function normalizeCity(raw: any): City {
  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.nome ?? 'Cidade sem nome'),
    uf: String(raw.uf ?? raw.state ?? ''),
    state: raw.state ?? null,
  };
}

function normalizeBeach(raw: any): Beach {
  return {
    id: String(raw.id),
    name: String(raw.name ?? 'Praia sem nome'),
    city_id: String(raw.city_id),
  };
}

export async function listCities() {
  const data = await apiRequest<any[]>('/cities', { requireAuth: true });
  return data.map(normalizeCity);
}

export async function listBeaches() {
  const data = await apiRequest<any[]>('/beaches', { requireAuth: true });
  return data.map(normalizeBeach);
}

export async function getBeachDetails(beachId: string) {
  const data = await apiRequest<any>(`/beaches/${beachId}`, { requireAuth: true });

  return {
    id: data?.id ? String(data.id) : undefined,
    name: data?.name,
    city_id: data?.city_id ? String(data.city_id) : undefined,
    temperature: data?.temperature ?? null,
    wave_height: data?.wave_height ?? null,
    wind_speed: data?.wind_speed ?? null,
    uv_index: data?.uv_index ?? null,
    risk_level: data?.risk_level ?? null,
    weather_updated_at: data?.weather_updated_at ?? null,
  } satisfies BeachDetails;
}
