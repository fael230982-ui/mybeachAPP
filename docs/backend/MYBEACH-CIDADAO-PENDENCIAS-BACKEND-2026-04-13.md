# MYBEACH-CIDADAO - Pendencias Backend

Data: 2026-04-13

## Contexto

Documento gerado apos revisar:

- [API Mbeach 1.0.txt](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\API\API%20Mbeach%201.0.txt:1)
- [MYBEACK-KIDS-GAP-API-NOVA-2026-04-13.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-GAP-API-NOVA-2026-04-13.md:1)
- [MYBEACK-KIDS-STATUS-IMPLEMENTACAO-UPDATE-16-2026-04-13.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-STATUS-IMPLEMENTACAO-UPDATE-16-2026-04-13.md:1)
- [MYBEACH-MOBILE-STATUS-IMPLEMENTACAO-UPDATE-10-2026-04-13.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-MOBILE-STATUS-IMPLEMENTACAO-UPDATE-10-2026-04-13.md:1)

## O que o backend ja publicou e o cidadao ja consegue consumir

- `POST /auth/login`
- `GET /users/me`
- `GET /children/`
- `POST /children/`
- `GET /children/{child_id}`
- `PUT /children/{child_id}`
- `DELETE /children/{child_id}`
- `POST /children/{child_id}/photo`
- `GET /alerts`
- `PATCH /alerts/{alert_id}/status`
- `PUT /locations/ping`
- `PATCH /users/{user_id}/fcm-token`

## Pendencias criticas para fechar o fluxo kids com mediacao parental

### 1. Consentimento parental remoto

Endpoints esperados:

- `GET /kids/guardian-consents/current`
- `POST /kids/guardian-consents`
- `POST /kids/guardian-consents/revoke`

Campos minimos esperados:

- `guardian_id`
- `child_profile_id` opcional na fase inicial
- `consent_version`
- `accepted_at`
- `accepted_by_name`
- `accepted_by_document`
- `relationship`
- `audit_id`

Motivo:

Hoje o aceite juridico do kids continua local. Isso impede fonte canonica remota para LGPD/ECA.

### 2. Conteudo infantil remoto

Endpoints esperados:

- `GET /kids/content`
- `POST /kids/content`
- `PATCH /kids/content/{id}`
- `POST /kids/content/{id}/request-publication`
- `POST /kids/content/{id}/review`

Estados canonicamente esperados:

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

Motivo:

Sem isso, descoberta/publicacao infantil ainda fica em fallback local e nao fecha auditoria real.

### 3. Notificacoes parentais remotas

Endpoints esperados:

- `GET /kids/guardian-notifications`
- `POST /kids/guardian-notifications/{id}/read`

Campos minimos esperados:

- `guardian_id`
- `type`
- `title`
- `message`
- `related_child_profile_id`
- `related_content_id`
- `created_at`
- `sent_at`
- `read_at`

Motivo:

Sem notificacao remota, a aprovacao item a item do responsavel nao sai do modo local.

## Pendencias importantes de contrato

### Ownership explicito

Os recursos sensiveis do fluxo kids precisam explicitar ownership por:

- `parent_id`
- ou `guardian_id`

Isso precisa ser verificavel no backend, nao apenas na interface.

### Auditoria

Eventos que precisam ficar auditados:

- criacao de perfil infantil
- upload de foto infantil
- aceite de consentimento
- revogacao de consentimento
- pedido de publicacao
- aprovacao ou rejeicao do responsavel
- publicacao final
- despublicacao administrativa

### Token e sessao

Ponto ainda pendente:

- contrato de expiracao
- refresh token oficial, se existir
- ou pelo menos expiracao consistente no JWT e semantica oficial de renovacao

## Pendencia especifica sobre foto infantil

O endpoint `POST /children/{child_id}/photo` ja existe, mas o uso operacional ainda precisa de definicao formal:

- foto fica privada por padrao
- quem pode subir
- quem pode consultar
- se existe URL assinada ou URL publica
- se ha moderacao
- se a foto pode ou nao participar de publicacao

Sem isso, o app continuara conservador e nao vai liberar esse fluxo por padrao.

## Recomendacao objetiva para o backend

1. manter `auth` e `children` como base canonica ja publicada
2. publicar um namespace `kids` apenas para mediacao parental e conteudo sensivel
3. devolver schemas claros para consentimento, conteudo e notificacoes
4. manter auditoria obrigatoria em toda decisao parental
5. documentar ownership e politica de foto infantil antes de abrir o upload no fluxo operacional

## Resultado esperado apos esse lote

Quando essas pendencias forem publicadas, o `MYBEACH-CIDADAO` consegue:

- parar de depender de fallback local para kids
- usar aprovacao parental real por item
- registrar consentimento remoto versionado
- exibir notificacoes parentais reais
- operar com trilha auditavel ponta a ponta
