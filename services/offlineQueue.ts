import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AlertCreateRequest } from '@/types/api';

type QueueType = 'alert' | 'location_ping';

type BaseQueueItem = {
  id: string;
  type: QueueType;
  createdAt: string;
  attempts: number;
  nextRetryAt: string;
  lastError?: string | null;
};

export type AlertQueueItem = BaseQueueItem & {
  type: 'alert';
  clientReferenceId: string;
  payload: AlertCreateRequest;
};

export type LocationPingPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  battery_level?: number | null;
};

export type LocationPingQueueItem = BaseQueueItem & {
  type: 'location_ping';
  payload: LocationPingPayload;
};

export type QueueItem = AlertQueueItem | LocationPingQueueItem;

const STORAGE_KEY = 'mybeach-offline-queue';
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;

function createQueueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildNextRetryAt(attempts: number) {
  const delay = Math.min(BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1), MAX_DELAY_MS);
  return new Date(Date.now() + delay).toISOString();
}

function formatRetryCountdown(targetTimeMs: number, nowMs: number) {
  const diffMs = Math.max(0, targetTimeMs - nowMs);
  const totalMinutes = Math.ceil(diffMs / 60_000);

  if (totalMinutes <= 1) {
    return 'em ate 1 min';
  }

  if (totalMinutes < 60) {
    return `em ${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `em ${hours}h ${minutes}min` : `em ${hours}h`;
}

async function readQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueueItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listQueueItems() {
  return readQueue();
}

export async function listRetryableQueueItems() {
  const now = Date.now();
  const items = await readQueue();
  return items.filter((item) => new Date(item.nextRetryAt).getTime() <= now);
}

export async function getQueueSummary() {
  const items = await readQueue();
  const now = Date.now();
  const nextRetryItem = items
    .slice()
    .sort((a, b) => new Date(a.nextRetryAt).getTime() - new Date(b.nextRetryAt).getTime())[0];

  return {
    total: items.length,
    alerts: items.filter((item) => item.type === 'alert').length,
    pings: items.filter((item) => item.type === 'location_ping').length,
    nextRetryAt: nextRetryItem?.nextRetryAt ?? null,
    nextRetryLabel: nextRetryItem ? getQueueItemRetryLabel(nextRetryItem, now) : null,
  };
}

export function getQueueItemRetryLabel(item: QueueItem, now = Date.now()) {
  const nextRetryMs = new Date(item.nextRetryAt).getTime();
  if (Number.isNaN(nextRetryMs) || nextRetryMs <= now) {
    return 'Pronto para sincronizar';
  }

  return `Novo retry ${formatRetryCountdown(nextRetryMs, now)}`;
}

export async function enqueueAlert(payload: AlertCreateRequest) {
  const items = await readQueue();
  const clientReferenceId = createQueueId();
  const sanitizedItems = items.filter((item) => {
    if (item.type !== 'alert') {
      return true;
    }

    return !(
      item.payload.alert_type === payload.alert_type &&
      item.payload.beach_id === payload.beach_id &&
      item.payload.created_by_id === payload.created_by_id
    );
  });

  const nextItems: QueueItem[] = [
    ...sanitizedItems,
    {
      id: createQueueId(),
      type: 'alert',
      clientReferenceId,
      createdAt: new Date().toISOString(),
      attempts: 0,
      nextRetryAt: new Date().toISOString(),
      lastError: null,
      payload,
    },
  ];

  await writeQueue(nextItems);
  return {
    clientReferenceId,
    queueSummary: await getQueueSummary(),
  };
}

export async function enqueueLocationPing(payload: LocationPingPayload) {
  const items = await readQueue();
  const sanitizedItems = items.filter((item) => item.type !== 'location_ping');
  const nextItems: QueueItem[] = [
    ...sanitizedItems,
    {
      id: createQueueId(),
      type: 'location_ping',
      createdAt: new Date().toISOString(),
      attempts: 0,
      nextRetryAt: new Date().toISOString(),
      lastError: null,
      payload,
    },
  ];

  await writeQueue(nextItems);
  return getQueueSummary();
}

export async function markQueueItemFailure(itemId: string, errorMessage: string) {
  const items = await readQueue();
  const nextItems = items.flatMap((item) => {
    if (item.id !== itemId) {
      return [item];
    }

    const attempts = item.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      return [];
    }

    return [
      {
        ...item,
        attempts,
        lastError: errorMessage,
        nextRetryAt: buildNextRetryAt(attempts),
      },
    ];
  });

  await writeQueue(nextItems);
}

export async function removeQueueItem(itemId: string) {
  const items = await readQueue();
  await writeQueue(items.filter((item) => item.id !== itemId));
}

export async function clearQueue() {
  await writeQueue([]);
}
