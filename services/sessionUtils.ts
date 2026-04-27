import { decodeJwtPayload } from './jwt';

export function formatTokenExpiration(token: string | null) {
  if (!token) {
    return 'Sessao por token de ambiente';
  }

  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;

  if (!exp) {
    return 'Expiracao nao informada';
  }

  return new Date(exp * 1000).toLocaleString('pt-BR');
}

export function formatRemainingSessionTime(expiresAt: string | null, nowMs = Date.now()) {
  if (!expiresAt) {
    return 'Tempo restante nao informado';
  }

  const diffMs = new Date(expiresAt).getTime() - nowMs;

  if (Number.isNaN(diffMs)) {
    return 'Tempo restante invalido';
  }

  if (diffMs <= 0) {
    return 'Sessao expirada';
  }

  const totalMinutes = Math.ceil(diffMs / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes} min restantes`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}min restantes` : `${hours}h restantes`;
}
