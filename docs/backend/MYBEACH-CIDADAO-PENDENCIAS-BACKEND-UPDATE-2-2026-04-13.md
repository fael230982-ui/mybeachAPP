# MYBEACH-CIDADAO - Pendencias Backend Update 2

Data: 2026-04-13

## Base revisada nesta rodada

- `API Mbeach 1.1.txt`
- `MYBEACH-MOBILE-STATUS-IMPLEMENTACAO-UPDATE-16-2026-04-13.md`
- `MYBEACK-KIDS-STATUS-IMPLEMENTACAO-UPDATE-22-2026-04-13.md`

## O que a API 1.1 confirmou

Ja disponivel e consumido no `MYBEACH-CIDADAO`:

- `POST /auth/login`
- `GET /users/me`
- `GET /children/`
- `POST /children/`
- `GET /children/{child_id}`
- `PUT /children/{child_id}`
- `DELETE /children/{child_id}`
- `POST /children/{child_id}/photo`
- `GET /health/live`
- `GET /health/ready`
- `GET /alerts`
- `PATCH /alerts/{alert_id}/status`
- `PUT /locations/ping`
- `PATCH /users/{user_id}/fcm-token`

## O que segue faltando para fechar o fluxo do responsavel

### 1. Consentimento parental remoto

Ainda falta contrato remoto versionado para:

- registrar aceite
- consultar aceite atual
- revogar aceite
- auditar versao, data, responsavel e vinculo com perfil infantil

Sem isso, o app continua com fallback local para a camada juridica do kids.

### 2. Conteudo infantil remoto com revisao parental

Ainda falta contrato remoto para:

- criar conteudo infantil
- pedir publicacao
- revisar item a item
- registrar decisao do responsavel
- opcionalmente publicar ou rejeitar

Estados esperados no backend:

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

### 3. Notificacoes parentais remotas

Ainda falta contrato remoto para:

- listar pendencias do responsavel
- marcar leitura
- apontar vinculo com `child_profile_id` e `content_id`
- registrar data de envio e leitura

Sem isso, a aprovacao por notificacao continua apenas modelada localmente.

Observacao:

- o ecossistema ja possui base para registrar token push do usuario via `PATCH /users/{user_id}/fcm-token`
- isso ajuda a entrega futura de notificacoes do responsavel
- o que ainda falta e o recurso canonico de notificacoes parentais propriamente dito

### 4. Politica operacional da foto infantil

O endpoint de foto existe, mas ainda falta definicao backend sobre:

- privacidade padrao
- quem pode subir
- quem pode visualizar
- se a URL sera assinada ou publica
- moderacao
- relacao entre foto de perfil e foto de conteudo

Enquanto isso nao vier fechado, o app continua bloqueando esse uso por padrao.

## Recomendacao objetiva para o backend

1. manter `children` como base remota de perfis infantis
2. publicar mediacao parental em namespace proprio ou contrato equivalente
3. devolver ownership explicito por `parent_id` ou `guardian_id`
4. manter auditoria obrigatoria de toda decisao parental
5. formalizar a politica de foto infantil antes da liberacao operacional

## Resultado esperado apos esse lote

Com essas entregas, o `MYBEACH-CIDADAO` consegue substituir o fallback local restante e operar o fluxo do responsavel de forma remota, auditavel e consistente com LGPD/ECA.
