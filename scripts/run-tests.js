function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const ALERT_STATUS_ALIASES = {
  ABERTO: 'REPORTED',
  NOVO: 'REPORTED',
  PENDENTE: 'REPORTED',
  ASSUMIDO: 'ACCEPTED',
  EM_ANDAMENTO: 'IN_PROGRESS',
  ENCERRADO: 'RESOLVED',
  FALSO_ALARME: 'FALSE_ALARM',
};

const ALERT_TYPE_ALIASES = {
  SOS_AGUA: 'DROWNING',
  POSSIVEL_AFOGAMENTO: 'DROWNING',
  CHILD_MISSING: 'LOST_CHILD',
};

function getRetryDelayMs(attempts) {
  return Math.min(30000 * 2 ** Math.max(0, attempts - 1), 15 * 60 * 1000);
}

function buildNextRetryAt(attempts, now) {
  return new Date(now + getRetryDelayMs(attempts)).toISOString();
}

function formatRetryCountdown(targetTimeMs, nowMs) {
  const diffMs = Math.max(0, targetTimeMs - nowMs);
  const totalMinutes = Math.ceil(diffMs / 60000);

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

function getQueueItemRetryLabel(item, now = Date.now()) {
  const nextRetryMs = new Date(item.nextRetryAt).getTime();
  if (Number.isNaN(nextRetryMs) || nextRetryMs <= now) {
    return 'Pronto para sincronizar';
  }

  return `Novo retry ${formatRetryCountdown(nextRetryMs, now)}`;
}

function dedupeAlertItems(items, payload) {
  return items.filter((item) => {
    if (item.type !== 'alert') {
      return true;
    }

    return !(
      item.payload.alert_type === payload.alert_type &&
      item.payload.beach_id === payload.beach_id &&
      item.payload.created_by_id === payload.created_by_id
    );
  });
}

function mergeTimeline(existingTimeline, incomingTimeline) {
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

function shouldMergeRecentAlert(existing, incoming) {
  return existing.id === incoming.id || Boolean(incoming.clientReferenceId && existing.clientReferenceId === incoming.clientReferenceId);
}

function resolveApiErrorCode(status) {
  return status === 401
    ? 'AUTH_UNAUTHORIZED'
    : status === 403
      ? 'AUTH_FORBIDDEN'
      : 'API_REQUEST_FAILED';
}

function resolveAuthToken(authToken, storedAccessToken, envToken) {
  return authToken ?? storedAccessToken ?? envToken ?? null;
}

function resolveAuthTokenType(authTokenType, storedTokenType) {
  return authTokenType ?? storedTokenType ?? 'Bearer';
}

function getQueueSyncFailureMessage(error) {
  return error instanceof Error ? error.message : 'Erro de sincronizacao';
}

function shouldStopQueueFlush(error) {
  return Boolean(error && (error.code === 'AUTH_UNAUTHORIZED' || error.code === 'AUTH_FORBIDDEN'));
}

function buildAlertStatusSnapshot(alert) {
  return {
    alert,
    source: 'list_fallback',
  };
}

function buildGuardianConsentRecord(version, acceptedByName, relationship) {
  return {
    version,
    acceptedAt: '2026-04-12T00:00:00.000Z',
    acceptedByName,
    acceptedByDocument: null,
    relationship,
  };
}

function buildProtectedChildDraft(displayName, ageBracket) {
  return {
    id: 'child-1',
    displayName,
    ageBracket,
    notes: null,
    photoEnabled: false,
    publicVisibility: false,
    createdAt: '2026-04-12T00:00:00.000Z',
  };
}

function buildChildContentDraft(title, category) {
  return {
    id: 'content-1',
    childProfileId: 'child-1',
    title,
    category,
    status: 'DRAFT_PRIVATE',
    photoRequested: false,
    publicRequested: false,
    createdAt: '2026-04-12T00:00:00.000Z',
    updatedAt: '2026-04-12T00:00:00.000Z',
  };
}

function requestChildPublication(draft) {
  return {
    ...draft,
    status: 'AWAITING_GUARDIAN_APPROVAL',
    publicRequested: true,
  };
}

function reviewChildContentDraft(draft, approve) {
  return {
    ...draft,
    status: approve ? 'GUARDIAN_APPROVED_FOR_PUBLICATION' : 'REJECTED_BY_GUARDIAN',
  };
}

function getKidsCapabilitySummary(token) {
  if (!token) {
    return {
      mode: 'LOCAL_SAFE',
      label: 'Modo kids local protegido',
    };
  }

  return {
    mode: 'REMOTE_READY',
    label: 'Modo kids remoto 1.3',
  };
}

function buildKidsIntegrationMapForTest(hasSession, features) {
  return [
    {
      id: 'session',
      state: hasSession ? 'remoto' : 'local',
    },
    {
      id: 'children',
      state: features.childrenCrud ? 'remoto' : 'local',
    },
    {
      id: 'content',
      state: features.childContent ? 'remoto' : 'local',
    },
    {
      id: 'consent',
      state: features.guardianConsents ? 'remoto' : 'local',
    },
    {
      id: 'notifications',
      state: features.guardianNotifications ? 'remoto' : 'local',
    },
    {
      id: 'child-photo',
      state: features.childPhotoUpload ? 'bloqueado' : 'local',
    },
  ];
}

function buildKidsBackendPendingSnapshotForTest(features) {
  return {
    pendingBackendAreas: {
      guardianConsents: !features.guardianConsents,
      childContent: !features.childContent,
      guardianNotifications: !features.guardianNotifications,
      childPhotoOperationalPolicy: features.childPhotoUpload,
    },
  };
}

function extractRefreshExpiresAtForTest(data, accessToken, nowMs) {
  const tokenParts = accessToken.split('.');
  if (tokenParts.length >= 2) {
    try {
      const normalizedPayload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(normalizedPayload, 'base64').toString('utf8'));
      if (typeof payload.exp === 'number') {
        return new Date(payload.exp * 1000).toISOString();
      }
    } catch {
      // fall back to expires_in_seconds
    }
  }

  return new Date(nowMs + data.expires_in_seconds * 1000).toISOString();
}

function buildChildPhotoPolicySnapshotForTest(policy) {
  return {
    childId: policy.child_id,
    photoAllowed: Boolean(policy.photo_allowed),
    requiresGuardianApproval: Boolean(policy.requires_guardian_approval),
    retentionPolicy: policy.retention_policy ?? null,
    legalBasis: policy.legal_basis ?? null,
    policyVersion: policy.policy_version ?? null,
  };
}

function formatRemainingTimeForTest(expiresAt, nowMs) {
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

function resolveAgeBracketFromBirthDateForTest(birthDate, now = new Date('2026-04-13T00:00:00Z')) {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) {
    return '6-9';
  }

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  if (age <= 5) {
    return '0-5';
  }

  if (age <= 9) {
    return '6-9';
  }

  if (age <= 13) {
    return '10-13';
  }

  return '14-17';
}

function run() {
  assert(ALERT_STATUS_ALIASES.ABERTO === 'REPORTED', 'ABERTO deve normalizar para REPORTED');
  assert(ALERT_STATUS_ALIASES.EM_ANDAMENTO === 'IN_PROGRESS', 'EM_ANDAMENTO deve normalizar');
  assert(ALERT_TYPE_ALIASES.SOS_AGUA === 'DROWNING', 'SOS_AGUA deve normalizar para DROWNING');
  assert(ALERT_TYPE_ALIASES.CHILD_MISSING === 'LOST_CHILD', 'CHILD_MISSING deve normalizar');

  assert(getRetryDelayMs(1) === 30000, 'Retry 1 deve esperar 30s');
  assert(getRetryDelayMs(2) === 60000, 'Retry 2 deve esperar 60s');
  assert(getRetryDelayMs(10) === 900000, 'Retry deve respeitar teto de 15 minutos');

  const now = 1700000000000;
  const nextRetryAt = buildNextRetryAt(3, now);
  assert(new Date(nextRetryAt).getTime() === now + 120000, 'Retry 3 deve gerar janela correta');
  assert(
    getQueueItemRetryLabel({ nextRetryAt: new Date(now - 1000).toISOString() }, now) === 'Pronto para sincronizar',
    'Item vencido deve ficar pronto para sincronizar'
  );
  assert(
    getQueueItemRetryLabel({ nextRetryAt: new Date(now + 120000).toISOString() }, now) === 'Novo retry em 2 min',
    'Item futuro deve mostrar janela humana de retry'
  );

  const items = [
    {
      type: 'alert',
      payload: {
        alert_type: 'DROWNING',
        beach_id: 'beach-1',
        created_by_id: 'user-1',
      },
    },
    {
      type: 'location_ping',
      payload: {},
    },
  ];

  const deduped = dedupeAlertItems(items, {
    alert_type: 'DROWNING',
    beach_id: 'beach-1',
    created_by_id: 'user-1',
  });

  assert(deduped.length === 1, 'Deduplicacao deve remover alerta equivalente e manter outros itens');

  const mergedTimeline = mergeTimeline(
    [
      { status: 'REPORTED', statusLabel: 'Reportado', createdAtLabel: '10:00', queued: false },
    ],
    [
      { status: 'REPORTED', statusLabel: 'Reportado', createdAtLabel: '10:00', queued: false },
      { status: 'IN_PROGRESS', statusLabel: 'Em atendimento', createdAtLabel: '10:05', queued: false },
    ]
  );

  assert(mergedTimeline.length === 2, 'Timeline deve evitar duplicado e aceitar novo status');
  assert(mergedTimeline[1].status === 'IN_PROGRESS', 'Timeline deve manter a ordem dos eventos');
  assert(
    shouldMergeRecentAlert(
      { id: 'queued-local-1', clientReferenceId: 'queued-local-1' },
      { id: 'alert-200', clientReferenceId: 'queued-local-1' }
    ) === true,
    'Historico remoto deve reconciliar alerta que nasceu na fila offline'
  );
  assert(
    shouldMergeRecentAlert(
      { id: 'queued-local-1', clientReferenceId: 'queued-local-1' },
      { id: 'alert-201', clientReferenceId: 'queued-local-2' }
    ) === false,
    'Historico nao deve juntar alertas offline diferentes'
  );

  assert(resolveApiErrorCode(401) === 'AUTH_UNAUTHORIZED', '401 deve virar AUTH_UNAUTHORIZED');
  assert(resolveApiErrorCode(403) === 'AUTH_FORBIDDEN', '403 deve virar AUTH_FORBIDDEN');
  assert(resolveApiErrorCode(500) === 'API_REQUEST_FAILED', '500 deve virar API_REQUEST_FAILED');

  assert(
    resolveAuthToken('token-local', 'token-store', 'token-env') === 'token-local',
    'Token explicito deve ter prioridade'
  );
  assert(
    resolveAuthToken(null, 'token-store', 'token-env') === 'token-store',
    'Token salvo deve vir antes do token de ambiente'
  );
  assert(
    resolveAuthToken(null, null, 'token-env') === 'token-env',
    'Token de ambiente deve ser fallback'
  );
  assert(resolveAuthToken(null, null, null) === null, 'Sem token deve retornar null');
  assert(resolveAuthTokenType('JWT', 'Bearer') === 'JWT', 'Token type explicito deve ter prioridade');
  assert(resolveAuthTokenType(null, 'Token') === 'Token', 'Token type salvo deve ser reutilizado');
  assert(resolveAuthTokenType(null, null) === 'Bearer', 'Sem token type deve usar Bearer');
  assert(
    getQueueSyncFailureMessage(new Error('Falha de rede')) === 'Falha de rede',
    'Mensagem de erro real deve ser preservada'
  );
  assert(
    getQueueSyncFailureMessage({}) === 'Erro de sincronizacao',
    'Erro generico deve virar mensagem padrao'
  );
  assert(
    shouldStopQueueFlush({ code: 'AUTH_UNAUTHORIZED' }) === true,
    '401 deve interromper flush'
  );
  assert(
    shouldStopQueueFlush({ code: 'AUTH_FORBIDDEN' }) === true,
    '403 deve interromper flush'
  );
  assert(
    shouldStopQueueFlush({ code: 'API_REQUEST_FAILED' }) === false,
    'Erro comum nao deve interromper flush'
  );
  assert(
    buildAlertStatusSnapshot({ id: 'alert-1' }).source === 'list_fallback',
    'Snapshot de status deve registrar a origem atual do fallback'
  );
  assert(
    buildAlertStatusSnapshot(null).alert === null,
    'Snapshot de status deve aceitar alerta ausente'
  );
  const guardianConsent = buildGuardianConsentRecord('2026-04-12.kids.1', 'Mae Exemplo', 'Mae');
  assert(guardianConsent.version === '2026-04-12.kids.1', 'Consentimento do responsavel deve ser versionado');
  assert(guardianConsent.acceptedByName === 'Mae Exemplo', 'Consentimento deve guardar nome do responsavel');

  const childDraft = buildProtectedChildDraft('Perfil infantil 1', '6-9');
  assert(childDraft.photoEnabled === false, 'Perfil infantil deve nascer com foto bloqueada');
  assert(childDraft.publicVisibility === false, 'Perfil infantil deve nascer sem visibilidade publica');
  assert(childDraft.ageBracket === '6-9', 'Perfil infantil deve manter faixa etaria');

  const childContent = buildChildContentDraft('Descoberta de praia', 'DISCOVERY');
  assert(
    childContent.status === 'DRAFT_PRIVATE',
    'Conteudo infantil deve nascer como rascunho privado'
  );
  assert(childContent.publicRequested === false, 'Rascunho privado nao pede publicacao automaticamente');

  const publicationRequested = requestChildPublication(childContent);
  assert(
    publicationRequested.status === 'AWAITING_GUARDIAN_APPROVAL',
    'Pedido de publicacao deve aguardar decisao do responsavel'
  );
  assert(
    publicationRequested.publicRequested === true,
    'Pedido de publicacao deve marcar intencao publica'
  );

  const approvedPublication = reviewChildContentDraft(publicationRequested, true);
  assert(
    approvedPublication.status === 'GUARDIAN_APPROVED_FOR_PUBLICATION',
    'Aprovacao do responsavel deve autorizar publicacao'
  );

  const rejectedContent = reviewChildContentDraft(publicationRequested, false);
  assert(rejectedContent.status === 'REJECTED_BY_GUARDIAN', 'Responsavel deve conseguir rejeitar conteudo');

  const localKidsMode = getKidsCapabilitySummary(null);
  assert(localKidsMode.mode === 'LOCAL_SAFE', 'Sem token, kids deve permanecer em modo local seguro');

  const remoteKidsMode = getKidsCapabilitySummary('jwt-token');
  assert(
    remoteKidsMode.mode === 'REMOTE_READY',
    'Com token, kids deve refletir API 1.3 remota para perfis, conteudo, consentimento e notificacoes'
  );
  const integrationMap = buildKidsIntegrationMapForTest(true, {
    childrenCrud: true,
    childContent: true,
    guardianConsents: true,
    guardianNotifications: true,
    childPhotoUpload: true,
  });
  assert(integrationMap[0].state === 'remoto', 'Sessao autenticada deve aparecer como remota');
  assert(integrationMap[1].state === 'remoto', 'Children remoto deve aparecer como remoto');
  assert(integrationMap[2].state === 'remoto', 'Conteudo kids remoto deve aparecer como remoto');
  assert(integrationMap[3].state === 'remoto', 'Consentimento parental remoto deve aparecer como remoto');
  assert(integrationMap[4].state === 'remoto', 'Notificacoes parentais remotas devem aparecer como remotas');
  assert(integrationMap[5].state === 'bloqueado', 'Foto infantil deve permanecer bloqueada');
  const backendPending = buildKidsBackendPendingSnapshotForTest({
    childrenCrud: true,
    childContent: true,
    guardianConsents: true,
    guardianNotifications: true,
    childPhotoUpload: true,
  });
  assert(
    backendPending.pendingBackendAreas.guardianConsents === false,
    'Consentimento parental remoto nao deve continuar pendente na API 1.3'
  );
  assert(
    backendPending.pendingBackendAreas.childContent === false,
    'Conteudo kids remoto nao deve continuar pendente na API 1.3'
  );
  assert(
    backendPending.pendingBackendAreas.guardianNotifications === false,
    'Notificacoes parentais remotas nao devem continuar pendentes na API 1.3'
  );
  assert(
    backendPending.pendingBackendAreas.childPhotoOperationalPolicy === true,
    'Upload remoto existente deve seguir marcado como politica operacional pendente'
  );
  const childPhotoPolicySnapshot = buildChildPhotoPolicySnapshotForTest({
    child_id: 'child-1',
    photo_allowed: false,
    requires_guardian_approval: true,
    retention_policy: 'blocked_until_operational_release',
    legal_basis: 'guardian_consent',
    policy_version: '1.3',
  });
  assert(childPhotoPolicySnapshot.childId === 'child-1', 'Politica de foto deve preservar child_id canonico');
  assert(childPhotoPolicySnapshot.photoAllowed === false, 'Politica de foto deve respeitar bloqueio remoto');
  assert(childPhotoPolicySnapshot.requiresGuardianApproval === true, 'Politica de foto deve exigir aprovacao');
  const refreshExpiresAt = extractRefreshExpiresAtForTest(
    {
      access_token: 'not-a-jwt',
      expires_in_seconds: 900,
    },
    'not-a-jwt',
    new Date('2026-04-13T00:00:00.000Z').getTime()
  );
  assert(
    refreshExpiresAt === '2026-04-13T00:15:00.000Z',
    'Refresh de sessao deve usar expires_in_seconds quando token nao trouxer exp'
  );
  assert(
    resolveAgeBracketFromBirthDateForTest('2022-01-01') === '0-5',
    'Birth date infantil recente deve virar faixa 0-5'
  );
  assert(
    resolveAgeBracketFromBirthDateForTest('2018-01-01') === '6-9',
    'Birth date deve refletir faixa 6-9'
  );
  assert(
    resolveAgeBracketFromBirthDateForTest('2013-01-01') === '10-13',
    'Birth date deve refletir faixa 10-13'
  );
  assert(
    resolveAgeBracketFromBirthDateForTest('2009-01-01') === '14-17',
    'Birth date mais antiga deve refletir faixa 14-17'
  );
  assert(
    formatRemainingTimeForTest('2026-04-13T00:30:00.000Z', new Date('2026-04-13T00:00:00.000Z').getTime()) ===
      '30 min restantes',
    'Tempo restante em minutos deve ser humano'
  );
  assert(
    formatRemainingTimeForTest('2026-04-13T03:00:00.000Z', new Date('2026-04-13T00:00:00.000Z').getTime()) ===
      '3h restantes',
    'Tempo restante em horas deve ser humano'
  );
  assert(
    formatRemainingTimeForTest('2026-04-12T23:59:00.000Z', new Date('2026-04-13T00:00:00.000Z').getTime()) ===
      'Sessao expirada',
    'Tempo restante vencido deve marcar sessao expirada'
  );

  console.log('run-tests: ok');
}

run();
