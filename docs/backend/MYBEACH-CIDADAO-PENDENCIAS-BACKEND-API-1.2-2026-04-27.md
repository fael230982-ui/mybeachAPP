# MYBEACH-CIDADAO - Pendências Backend API 1.2

Data: 2026-04-27

## Base analisada

- `C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\API\API Mbeach 1.2.txt`

## Contratos 1.2 aproveitados no app cidadão

- `GET /kids/guardian-consents/current`
- `POST /kids/guardian-consents`
- `POST /kids/guardian-consents/revoke`
- `GET /kids/content`
- `POST /kids/content`
- `PATCH /kids/content/{content_id}`
- `POST /kids/content/{content_id}/request-publication`
- `POST /kids/content/{content_id}/review`
- `GET /kids/guardian-notifications`
- `POST /kids/guardian-notifications/{notification_id}/read`
- `GET /children/{child_id}/photo-policy`
- `POST /auth/me/privacy-consent`

## Pendências removidas em relação à API 1.1

- Consentimento parental remoto versionado deixou de ser pendência de contrato.
- Conteúdo infantil remoto com pedido e revisão de publicação deixou de ser pendência de contrato.
- Notificações parentais remotas com leitura deixaram de ser pendência de contrato.

## Pendências backend ainda existentes

### 1. Schema formal da política de foto infantil

O endpoint `GET /children/{child_id}/photo-policy` existe, mas a OpenAPI 1.2 expõe resposta `200` com schema vazio.

Necessário formalizar campos como:

- `photo_enabled`
- `default_visibility`
- `allowed_upload_roles`
- `allowed_view_roles`
- `moderation_required`
- `url_type`
- `retention_policy`
- `legal_basis`

### 2. Liberação operacional de foto infantil

`POST /children/{child_id}/photo` e os campos `photo_url`, `photo_visibility` e `photo_moderation_status` existem, mas ainda falta uma política operacional fechada para liberar uso no app cidadão.

Até isso ser homologado, o app continua bloqueando upload de foto infantil.

### 3. Auditoria consultável para LGPD/Kids

A API 1.2 registra `audit_id` em consentimento parental, mas o app ainda não recebeu contrato consultável para auditoria, histórico ou relatório de:

- aceite LGPD
- consentimento parental
- revogação
- pedido de publicação infantil
- decisão do responsável
- leitura de notificação parental

### 4. Revogação/gestão remota do aceite LGPD

`GET/POST /auth/me/privacy-consent` existe, mas não há contrato documentado para:

- revogar aceite
- listar histórico de versões aceitas
- consultar texto/versão canônica publicada pelo backend

### 5. Critérios finais de homologação

Ainda é necessário o backend confirmar, em ambiente de homologação:

- quais perfis podem acessar recursos Kids
- quais status de `KidsContentResponse.status` são canônicos
- quando uma notificação parental é criada pelo servidor
- se `sent_at` é obrigatório antes da entrega push ou apenas registro lógico
- como o backend se comporta quando o responsável rejeita publicação

## Observação para o mobile

O app cidadão já está preparado para usar os contratos remotos da API 1.2 com fallback local seguro. O principal bloqueio restante não é mais ausência dos endpoints Kids, mas fechamento de política, auditoria consultável e homologação operacional.
