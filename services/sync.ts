import { isAuthError } from './api';
import { createAlert, toAlertViewModel } from './alerts';
import { listRetryableQueueItems, markQueueItemFailure, QueueItem, removeQueueItem } from './offlineQueue';
import { recordViewModelAlert } from './recentAlerts';
import { pingLocation } from './locations';

export function getQueueSyncFailureMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro de sincronizacao';
}

export function shouldStopQueueFlush(error: unknown) {
  return isAuthError(error);
}

export async function processQueueItem(item: QueueItem) {
  if (item.type === 'alert') {
    const response = await createAlert(item.payload);
    await recordViewModelAlert(toAlertViewModel(response), {
      clientReferenceId: item.clientReferenceId,
    });
  }

  if (item.type === 'location_ping') {
    await pingLocation(item.payload);
  }

  await removeQueueItem(item.id);
}

export async function flushOfflineQueue() {
  const items = await listRetryableQueueItems();

  for (const item of items) {
    try {
      await processQueueItem(item);
    } catch (error) {
      if (shouldStopQueueFlush(error)) {
        break;
      }

      await markQueueItemFailure(item.id, getQueueSyncFailureMessage(error));
    }
  }
}
