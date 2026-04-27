# MYBEACH-CIDADAO - Pendências Backend API 1.3

Data: 2026-04-27

## Base analisada

- `C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\API\API Mbeach 1.3.txt`

## Diferença relevante para o app cidadão

A API 1.3 não adicionou novos endpoints em relação à API 1.2, mas formalizou schemas que antes estavam ausentes.

Para o cidadão, o ganho direto foi:

- `ChildPhotoPolicyResponse` em `GET /children/{child_id}/photo-policy`

## Contratos aproveitados no app cidadão

- `POST /auth/me/privacy-consent`
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

## Pendências removidas desde a API 1.2

- Schema formal da resposta de `GET /children/{child_id}/photo-policy`.

## Pendências backend ainda existentes

1. Fechar política operacional de foto infantil antes de liberar upload no cidadão.
2. Publicar auditoria consultável para aceite LGPD, consentimento parental, revogação e decisões Kids.
3. Publicar contrato de revogação/histórico do aceite LGPD.
4. Confirmar status canônicos de `KidsContentResponse.status`.
5. Confirmar regra de criação, envio e leitura de notificações parentais.
6. Confirmar perfis autorizados para operar recursos Kids em homologação.
7. Confirmar se os endpoints administrativos novos/documentados em schemas 1.3 (`workforce`, `dashboard`, `logs`, `fleet telemetry`) são exclusivos do admin ou se algum resumo deve ser exposto ao cidadão.

## Estado do app cidadão

O app foi atualizado para `API Mbeach 1.3`, usa a política tipada de foto infantil e mantém fallback local seguro. O upload de foto infantil continua bloqueado até fechamento jurídico e operacional.
