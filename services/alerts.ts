import {
  ALERT_STATUS_LABELS,
  ALERT_TYPE,
  ALERT_TYPE_ALIASES,
  ALERT_TYPE_LABELS,
  toCanonicalAlertStatus,
} from '@/constants/contracts';
import {
  AlertCreateRequest,
  AlertResponse,
  AlertStatusSnapshot,
  AlertType,
  AlertViewModel,
} from '@/types/api';

import { apiRequest } from './api';

function normalizeAlertType(type: string | null | undefined): AlertType {
  const value = String(type ?? '').toUpperCase();
  return ALERT_TYPE_ALIASES[value] ?? ALERT_TYPE.MEDICAL;
}

export async function createAlert(payload: AlertCreateRequest) {
  return apiRequest<AlertResponse>('/alerts', {
    method: 'POST',
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function listAlerts() {
  return apiRequest<AlertResponse[]>('/alerts', {
    requireAuth: true,
  });
}

export async function getAlertById(alertId: string) {
  const alerts = await listAlerts();
  return alerts.find((alert) => alert.id === alertId) ?? null;
}

export async function getAlertStatusSnapshot(alertId: string): Promise<AlertStatusSnapshot> {
  const alert = await getAlertById(alertId);
  return {
    alert,
    source: 'list_fallback',
  };
}

export function getAlertTypeLabel(type: AlertType) {
  return ALERT_TYPE_LABELS[type] ?? type;
}

export function getAlertStatusLabel(status: string) {
  const canonicalStatus = toCanonicalAlertStatus(status);
  return ALERT_STATUS_LABELS[canonicalStatus] ?? canonicalStatus;
}

export function toAlertViewModel(alert: AlertResponse): AlertViewModel {
  const alertType = normalizeAlertType(alert.alert_type);
  const canonicalStatus = toCanonicalAlertStatus(alert.status);
  const createdAt = alert.created_at
    ? new Date(alert.created_at).toLocaleString('pt-BR')
    : 'Horario nao informado';
  const acceptedAt = alert.accepted_at
    ? new Date(alert.accepted_at).toLocaleString('pt-BR')
    : null;
  const finishedAt = alert.finished_at
    ? new Date(alert.finished_at).toLocaleString('pt-BR')
    : null;

  return {
    id: alert.id,
    type: alertType,
    status: canonicalStatus,
    statusLabel: getAlertStatusLabel(canonicalStatus),
    createdAtLabel: createdAt,
    acceptedAtLabel: acceptedAt,
    finishedAtLabel: finishedAt,
    beachId: alert.beach_id ?? null,
    cityId: alert.city_id ?? null,
    zoneId: alert.zone_id ?? null,
    batteryLevel: alert.battery_level ?? null,
    childId: alert.child_id ?? null,
    parentId: alert.parent_id ?? null,
    resolvedById: (alert as any).resolved_by_id ? String((alert as any).resolved_by_id) : null,
    coordinates: {
      latitude: alert.latitude,
      longitude: alert.longitude,
    },
  };
}
