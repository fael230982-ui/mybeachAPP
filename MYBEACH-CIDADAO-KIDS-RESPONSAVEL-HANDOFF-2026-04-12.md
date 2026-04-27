# MYBEACH-CIDADAO - Kids Responsavel Handoff

Data: 2026-04-12

## Objetivo

Este documento define o papel do `MYBEACH-CIDADAO` no ecossistema `MYBEACH-KIDS`.

O `MYBEACH-CIDADAO` nao e o app infantil.

Ele e o app principal do responsavel para:

- identidade
- consentimento
- vinculo com crianca
- notificacoes de aprovacao
- decisao parental por item
- supervisao e privacidade

## Fontes de alinhamento

- [MYBEACK-KIDS-CONTRATO-INTEGRACAO-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-CONTRATO-INTEGRACAO-2026-04-12.md:1)
- [MYBEACH-KIDS-MOBILE-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-MOBILE-HANDOFF-2026-04-12.md:1)
- [MYBEACH-KIDS-BACKEND-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-BACKEND-HANDOFF-2026-04-12.md:1)

## Telas e acoes minimas do responsavel

### 1. Perfis infantis vinculados

O app do responsavel deve permitir:

- listar perfis infantis
- criar rascunho de perfil infantil
- consultar status do perfil
- revisar dados basicos do vinculo

Contrato esperado:

- `GET /kids/children`
- `POST /kids/children`
- `GET /kids/children/:id`
- `PATCH /kids/children/:id`

### 2. Consentimento parental

O app deve permitir:

- registrar aceite
- consultar versao vigente
- exibir data, hora e relacionamento
- iniciar revogacao quando aplicavel

Contrato esperado:

- `POST /kids/guardian-consents`
- `GET /kids/guardian-consents/current`
- `POST /kids/guardian-consents/revoke`

### 3. Fila de aprovacao do responsavel

O app deve permitir:

- receber pendencias
- abrir a pendencia por item
- aprovar
- rejeitar
- registrar motivo quando necessario

Contrato esperado:

- `GET /kids/content`
- `GET /kids/content/:id`
- `POST /kids/content/:id/review`

Estados canonicamente esperados:

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

### 4. Notificacoes parentais

O app deve permitir:

- listar notificacoes
- marcar como lida
- abrir o item relacionado

Contrato esperado:

- `GET /kids/guardian-notifications`
- `POST /kids/guardian-notifications/:id/read`

## Regras obrigatorias do modulo cidadao

- sem sessao autenticada do responsavel, nada remoto de kids deve abrir
- sem consentimento parental vigente, perfil infantil nao deve seguir para operacao real
- o app pode manter modo local seguro enquanto a API nao estiver pronta
- nenhuma aprovacao publica infantil deve acontecer fora da decisao do responsavel
- foto infantil segue bloqueada por padrao
- geolocalizacao publica infantil segue proibida

## Prioridade de implementacao no MYBEACH-CIDADAO

1. integrar consulta de consentimento parental vigente
2. integrar listagem de perfis infantis
3. integrar notificacoes do responsavel
4. integrar revisao de conteudo infantil
5. trocar o fluxo local do responsavel por consumo real da API quando o backend estiver pronto

## Base tecnica preparada neste repositorio

Arquivos ja preparados:

- [services/kids.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\services\kids.ts:1)
- [stores/kidsSafetyStore.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\stores\kidsSafetyStore.ts:1)
- [app/(tabs)/account.tsx](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\app\(tabs)\account.tsx:1)
- [types/api.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\types\api.ts:1)

## Diretriz final

O `MYBEACH-CIDADAO` deve continuar como painel principal do responsavel no ecossistema kids.

O fluxo local atual continua valido como fallback seguro.
Quando o backend estiver pronto, a migracao correta e substituir gradualmente a simulacao local por integracao real com os endpoints canonicos.
