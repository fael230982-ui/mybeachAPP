import { apiRequest } from './api';

type HealthResponse = {
  status?: string;
  ok?: boolean;
  detail?: string;
  [key: string]: unknown;
};

export async function getLiveHealth() {
  return apiRequest<HealthResponse>('/health/live');
}

export async function getReadyHealth() {
  return apiRequest<HealthResponse>('/health/ready');
}
