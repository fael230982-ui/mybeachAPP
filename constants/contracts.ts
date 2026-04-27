import type { AlertStatus } from '@/types/api';

export const ALERT_TYPE = {
  DROWNING: 'DROWNING',
  MEDICAL: 'MEDICAL',
  LOST_CHILD: 'LOST_CHILD',
} as const;

export const ALERT_STATUS = {
  REPORTED: 'REPORTED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  FALSE_ALARM: 'FALSE_ALARM',
} as const;

export const ALERT_STATUS_ALIASES: Record<string, AlertStatus> = {
  ABERTO: ALERT_STATUS.REPORTED,
  NOVO: ALERT_STATUS.REPORTED,
  PENDING: ALERT_STATUS.REPORTED,
  PENDENTE: ALERT_STATUS.REPORTED,
  RECEIVED: ALERT_STATUS.REPORTED,
  REPORTED: ALERT_STATUS.REPORTED,
  DISPATCHED: ALERT_STATUS.ACCEPTED,
  ASSIGNED: ALERT_STATUS.ACCEPTED,
  ASSUMIDO: ALERT_STATUS.ACCEPTED,
  ACCEPTED: ALERT_STATUS.ACCEPTED,
  EM_ANDAMENTO: ALERT_STATUS.IN_PROGRESS,
  EM_ATENDIMENTO: ALERT_STATUS.IN_PROGRESS,
  EM_DESLOCAMENTO: ALERT_STATUS.IN_PROGRESS,
  IN_PROGRESS: ALERT_STATUS.IN_PROGRESS,
  ENCERRADO: ALERT_STATUS.RESOLVED,
  FINALIZADO: ALERT_STATUS.RESOLVED,
  RESOLVED: ALERT_STATUS.RESOLVED,
  FALSO_ALARME: ALERT_STATUS.FALSE_ALARM,
  CANCELLED: ALERT_STATUS.FALSE_ALARM,
  FALSE_ALARM: ALERT_STATUS.FALSE_ALARM,
};

export const ALERT_TYPE_ALIASES: Record<string, keyof typeof ALERT_TYPE> = {
  SOS_AGUA: ALERT_TYPE.DROWNING,
  DROWNING: ALERT_TYPE.DROWNING,
  POSSIVEL_AFOGAMENTO: ALERT_TYPE.DROWNING,
  LOST_CHILD: ALERT_TYPE.LOST_CHILD,
  CHILD_MISSING: ALERT_TYPE.LOST_CHILD,
  MEDICAL: ALERT_TYPE.MEDICAL,
};

export const ALERT_STATUS_LABELS: Record<string, string> = {
  REPORTED: 'Reportado',
  ACCEPTED: 'Aceito pela equipe',
  IN_PROGRESS: 'Em atendimento',
  RESOLVED: 'Encerrado',
  FALSE_ALARM: 'Alarme falso',
};

export const ALERT_STATUS_TONES: Record<string, { background: string; text: string }> = {
  REPORTED: { background: '#dbeafe', text: '#1d4ed8' },
  ACCEPTED: { background: '#ede9fe', text: '#6d28d9' },
  IN_PROGRESS: { background: '#fef3c7', text: '#b45309' },
  RESOLVED: { background: '#dcfce7', text: '#15803d' },
  FALSE_ALARM: { background: '#fee2e2', text: '#b91c1c' },
  QUEUED_OFFLINE: { background: '#e2e8f0', text: '#334155' },
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  DROWNING: 'Afogamento',
  LOST_CHILD: 'Crianca perdida',
  MEDICAL: 'Emergencia medica',
};

export function toCanonicalAlertStatus(status: string) {
  return ALERT_STATUS_ALIASES[String(status).toUpperCase()] ?? status;
}

export function getAlertStatusTone(status: string) {
  return ALERT_STATUS_TONES[toCanonicalAlertStatus(status)] ?? ALERT_STATUS_TONES.QUEUED_OFFLINE;
}
