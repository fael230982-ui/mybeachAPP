import { apiRequest } from './api';

export async function updateUserFcmToken(userId: string, fcmToken: string) {
  return apiRequest(`/users/${userId}/fcm-token`, {
    method: 'PATCH',
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fcm_token: fcmToken,
    }),
  });
}
