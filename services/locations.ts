import { apiRequest } from './api';

import type { LocationPingPayload } from './offlineQueue';

export async function pingLocation(payload: LocationPingPayload) {
  return apiRequest('/locations/ping', {
    method: 'PUT',
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
