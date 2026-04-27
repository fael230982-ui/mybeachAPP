# MYBEACH-KIDS - Backend Handoff

Data: 2026-04-12

## Objetivo

Este documento orienta o desenvolvimento do backend necessario para sustentar o app `MYBEACH-KIDS` conectado ao ecossistema `MYBEACH`.

Premissa:

- `MYBEACH-KIDS` sera app separado
- `responsavel` e a conta principal
- `crianca` e perfil vinculado ao responsavel
- qualquer publicacao passa por decisao do responsavel
- conteudo infantil nao deve nascer publico

## Entidades recomendadas

### 1. guardian_accounts

Representa a conta do responsavel.

Campos minimos:

- `id`
- `user_id`
- `full_name`
- `email`
- `document`
- `phone`
- `created_at`
- `updated_at`

### 2. child_profiles

Representa o perfil infantil.

Campos minimos:

- `id`
- `display_name`
- `age_bracket`
- `notes`
- `photo_enabled`
- `public_visibility`
- `status`
- `created_at`
- `updated_at`

Observacao:

- `photo_enabled` deve iniciar `false`
- `public_visibility` deve iniciar `false`

### 3. guardian_child_links

Vinculo entre responsavel e crianca.

Campos minimos:

- `id`
- `guardian_id`
- `child_profile_id`
- `relationship`
- `is_active`
- `created_at`
- `updated_at`

### 4. guardian_consents

Registro de consentimento parental versionado.

Campos minimos:

- `id`
- `guardian_id`
- `child_profile_id` opcional na primeira fase
- `consent_version`
- `accepted_at`
- `accepted_by_name`
- `accepted_by_document`
- `relationship`
- `ip_address` opcional
- `user_agent` opcional

### 5. child_content

Conteudo criado no app infantil.

Campos minimos:

- `id`
- `child_profile_id`
- `guardian_id`
- `title`
- `description`
- `category`
- `media_url` opcional
- `photo_requested`
- `public_requested`
- `status`
- `created_at`
- `updated_at`

Estados recomendados:

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

### 6. child_content_reviews

Historico de decisao do responsavel.

Campos minimos:

- `id`
- `child_content_id`
- `guardian_id`
- `decision`
- `decision_reason` opcional
- `reviewed_at`
- `consent_version`

Decisoes:

- `APPROVE`
- `REJECT`

### 7. guardian_notifications

Fila/log de notificacoes do responsavel.

Campos minimos:

- `id`
- `guardian_id`
- `type`
- `title`
- `message`
- `related_child_profile_id`
- `related_content_id`
- `created_at`
- `sent_at`
- `read_at`

Tipos:

- `KIDS_PROFILE_LINKED`
- `KIDS_CONTENT_REVIEW`

### 8. audit_logs

Trilha de auditoria.

Campos minimos:

- `id`
- `actor_user_id`
- `actor_role`
- `entity_type`
- `entity_id`
- `action`
- `payload_json`
- `created_at`

## Endpoints recomendados

### Responsavel e vinculo

- `POST /kids/guardian-consents`
- `GET /kids/guardian-consents/current`
- `POST /kids/children`
- `GET /kids/children`
- `GET /kids/children/:id`
- `PATCH /kids/children/:id`

### Conteudo infantil

- `POST /kids/content`
- `GET /kids/content`
- `GET /kids/content/:id`
- `PATCH /kids/content/:id`
- `POST /kids/content/:id/request-publication`
- `POST /kids/content/:id/review`

### Notificacoes do responsavel

- `GET /kids/guardian-notifications`
- `POST /kids/guardian-notifications/:id/read`

### Admin

- `GET /admin/kids/children`
- `GET /admin/kids/content`
- `GET /admin/kids/content/:id`
- `POST /admin/kids/content/:id/unpublish`
- `POST /admin/kids/children/:id/block`

## Regras de negocio recomendadas

### Criacao de perfil infantil

- so pode existir se houver responsavel autenticado
- consentimento parental deve estar registrado
- perfil nasce privado
- foto infantil nao deve ser liberada por padrao

### Criacao de conteudo infantil

- conteudo nasce `DRAFT_PRIVATE`
- se houver pedido de publicacao, muda para `AWAITING_GUARDIAN_APPROVAL`
- deve gerar notificacao para o responsavel

### Aprovacao do responsavel

- responsavel decide `sim` ou `nao` por item
- se `sim`, conteudo vai para `GUARDIAN_APPROVED_FOR_PUBLICATION`
- publicacao final em `PUBLISHED` pode ser automatica ou moderada
- se `nao`, vai para `REJECTED_BY_GUARDIAN`

### Publicacao

- nunca publicar sem registro de aprovacao parental
- nunca publicar foto infantil automaticamente
- geolocalizacao publica deve ser proibida

## Regras de seguranca e compliance

- coleta minima de dados
- acesso restrito por guardian_id
- auditoria obrigatoria de aceite e revisao
- exclusao logica e exclusao fisica conforme politica definida
- endpoint para revogacao de consentimento
- endpoint para exclusao de perfil infantil

## Contratos esperados pelo ecossistema

O backend deve conversar com:

- `MYBEACH-CIDADAO`
- futuro `MYBEACH-KIDS`
- `MYBEACH-ADMIN`

O `MYBEACH-CIDADAO` ja modelou localmente:

- `GuardianConsentRecord`
- `ChildLinkedProfile`
- `ChildContentDraft`
- `GuardianNotificationItem`

Referencia:

- [types/api.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\types\api.ts:1)
- [stores/kidsSafetyStore.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\stores\kidsSafetyStore.ts:1)

## Ordem recomendada de implementacao

1. entidades e migrations
2. consentimento parental versionado
3. CRUD de perfil infantil
4. fluxo de conteudo infantil
5. notificacoes do responsavel
6. auditoria
7. endpoints admin

## Recomendacao final

O backend deve nascer conservador:

- tudo privado por padrao
- publicacao sempre dependente de aprovacao
- foto infantil bloqueada por padrao
- trilha de auditoria obrigatoria

Esse e o caminho mais seguro para permitir crescimento posterior sem criar risco regulatorio desnecessario.
