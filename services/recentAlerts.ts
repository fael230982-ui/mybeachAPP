import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AlertType, AlertViewModel } from '@/types/api';

const STORAGE_KEY = 'mybeach-recent-alerts';
const MAX_ITEMS = 8;

export type RecentAlertItem = {
  id: string;
  clientReferenceId?: string | null;
  type: AlertType;
  status: string;
  statusLabel: string;
  createdAtLabel: string;
  beachId?: string | null;
  cityId?: string | null;
  queued?: boolean;
  timeline?: RecentAlertTimelineEntry[];
};

export type RecentAlertTimelineEntry = {
  status: string;
  statusLabel: string;
  createdAtLabel: string;
  queued?: boolean;
};

async function readItems(): Promise<RecentAlertItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as RecentAlertItem[];
  } catch {
    return [];
  }
}

async function writeItems(items: RecentAlertItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export async function listRecentAlerts() {
  return readItems();
}

export async function upsertRecentAlert(item: RecentAlertItem) {
  const items = await readItems();
  const existingItem = items.find(
    (existing) =>
      existing.id === item.id ||
      Boolean(item.clientReferenceId && existing.clientReferenceId === item.clientReferenceId)
  );
  const deduped = items.filter(
    (existing) =>
      existing.id !== item.id &&
      (!item.clientReferenceId || existing.clientReferenceId !== item.clientReferenceId)
  );

  const nextTimeline = mergeTimeline(existingItem?.timeline ?? [], item.timeline ?? [
    {
      status: item.status,
      statusLabel: item.statusLabel,
      createdAtLabel: item.createdAtLabel,
      queued: item.queued,
    },
  ]);

  await writeItems([
    {
      ...item,
      timeline: nextTimeline,
    },
    ...deduped,
  ]);
}

export async function recordViewModelAlert(
  alert: AlertViewModel,
  options?: {
    clientReferenceId?: string | null;
  }
) {
  await upsertRecentAlert({
    id: alert.id,
    clientReferenceId: options?.clientReferenceId ?? null,
    type: alert.type,
    status: alert.status,
    statusLabel: alert.statusLabel,
    createdAtLabel: alert.createdAtLabel,
    beachId: alert.beachId ?? null,
    cityId: alert.cityId ?? null,
    queued: false,
    timeline: [
      {
        status: alert.status,
        statusLabel: alert.statusLabel,
        createdAtLabel: alert.createdAtLabel,
        queued: false,
      },
    ],
  });
}

export async function recordQueuedAlert(payload: {
  clientReferenceId: string;
  type: AlertType;
  beachId?: string | null;
  cityId?: string | null;
}) {
  const createdAtLabel = new Date().toLocaleString('pt-BR');
  await upsertRecentAlert({
    id: payload.clientReferenceId,
    clientReferenceId: payload.clientReferenceId,
    type: payload.type,
    status: 'QUEUED_OFFLINE',
    statusLabel: 'Em fila offline',
    createdAtLabel,
    beachId: payload.beachId ?? null,
    cityId: payload.cityId ?? null,
    queued: true,
    timeline: [
      {
        status: 'QUEUED_OFFLINE',
        statusLabel: 'Em fila offline',
        createdAtLabel,
        queued: true,
      },
    ],
  });
}

function mergeTimeline(
  existingTimeline: RecentAlertTimelineEntry[],
  incomingTimeline: RecentAlertTimelineEntry[]
) {
  const timeline = [...existingTimeline];

  for (const entry of incomingTimeline) {
    const duplicate = timeline.some(
      (existing) =>
        existing.status === entry.status &&
        existing.createdAtLabel === entry.createdAtLabel &&
        Boolean(existing.queued) === Boolean(entry.queued)
    );

    if (!duplicate) {
      timeline.push(entry);
    }
  }

  return timeline.slice(-6);
}
