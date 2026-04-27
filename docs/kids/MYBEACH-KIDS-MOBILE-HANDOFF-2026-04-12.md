# MYBEACH-KIDS - Mobile Handoff

Data: 2026-04-12

## Objetivo

Este documento orienta a integracao entre o app do responsavel no ecossistema `MYBEACH` e o futuro/app atual `MYBEACH-KIDS`.

O foco do `MYBEACH-MOBILE` deve ser o papel do responsavel:

- vincular criancas
- revisar solicitacoes de publicacao
- receber notificacoes
- acompanhar consentimentos
- monitorar seguranca e privacidade

## Contexto atual

Ja existe um app infantil separado em andamento conforme:

- [MYBEACK-KIDS-STATUS-IMPLEMENTACAO-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-STATUS-IMPLEMENTACAO-2026-04-12.md:1)
- [MYBEACK-KIDS-CONTRATO-INTEGRACAO-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-CONTRATO-INTEGRACAO-2026-04-12.md:1)

Esse app ja assume:

- perfil infantil privado por padrao
- foto infantil bloqueada por padrao
- geolocalizacao publica proibida
- publicacao mediada por responsavel

## Papel recomendado do app do responsavel

O app do responsavel nao deve reproduzir a experiencia infantil.

Ele deve funcionar como painel de governanca operacional do vinculo parental.

Funcoes principais:

- autenticar o responsavel
- criar e gerenciar vinculo com a crianca
- aceitar termo e consentimento parental versionado
- receber notificacoes de pedido de publicacao
- aprovar ou rejeitar cada item
- consultar historico de decisoes
- revogar consentimento quando aplicavel

## Fluxo recomendado

1. responsavel faz login
2. responsavel cria ou vincula perfil infantil
3. crianca usa `MYBEACH-KIDS` em perfil protegido
4. quando a crianca pedir publicacao, o backend cria uma pendencia
5. o app do responsavel recebe notificacao
6. o responsavel escolhe `aprovar` ou `rejeitar`
7. a decisao fica auditada
8. apenas itens aprovados podem seguir para publicacao

## Estados de conteudo infantil

Estados canonicamente esperados:

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

## Telas recomendadas no app do responsavel

- listagem de perfis infantis vinculados
- resumo de consentimentos ativos
- caixa de notificacoes parentais
- fila de aprovacao de publicacoes
- historico de decisoes
- configuracoes de privacidade infantil
- acao de revogar, bloquear ou pedir exclusao

## Endpoints canonicos esperados do backend

O `MYBEACH-MOBILE` deve conversar com endpoints equivalentes a:

- `POST /kids/children`
- `GET /kids/children`
- `GET /kids/children/:id`
- `PATCH /kids/children/:id`
- `POST /kids/guardian-consents`
- `GET /kids/guardian-consents/current`
- `POST /kids/guardian-consents/revoke`
- `GET /kids/content`
- `GET /kids/content/:id`
- `POST /kids/content/:id/request-publication`
- `POST /kids/content/:id/review`
- `GET /kids/guardian-notifications`
- `POST /kids/guardian-notifications/:id/read`

## Ponto de arquitetura ainda pendente

O contrato novo deixa aberto um ponto importante:

- definir se o `MYBEACH-KIDS` tera login proprio
- ou se usara sessao delegada a partir do ecossistema do responsavel

O `MYBEACH-MOBILE` deve ser preparado para as duas possibilidades, mas a recomendacao mais segura continua sendo conta principal do responsavel e vinculacao infantil mediada pelo backend.

## Notificacoes recomendadas

Eventos minimos:

- novo pedido de publicacao infantil
- rejeicao ou aprovacao registrada
- consentimento vencido ou versao antiga
- necessidade de revisao de vinculo
- alerta administrativo envolvendo perfil infantil

## Regras obrigatorias

- nada infantil deve publicar automaticamente
- sem aprovacao do responsavel nao publica
- nada de geolocalizacao publica infantil
- foto infantil continua bloqueada por padrao ate decisao juridica formal
- todo consentimento deve guardar versao, data, hora e origem
- toda aprovacao ou rejeicao deve gerar auditoria

## Integracoes correlatas

- [MYBEACH-KIDS-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-HANDOFF-2026-04-12.md:1)
- [MYBEACH-KIDS-BACKEND-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-BACKEND-HANDOFF-2026-04-12.md:1)
- [MYBEACH-KIDS-ADMIN-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-ADMIN-HANDOFF-2026-04-12.md:1)
- [MYBEACK-KIDS-CONTRATO-INTEGRACAO-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-CONTRATO-INTEGRACAO-2026-04-12.md:1)

## Diretriz final

O `MYBEACH-MOBILE` deve ser a extensao do responsavel no ecossistema kids.

Nao e o app infantil.
Nao deve expor experiencia ludica.
Deve priorizar controle, seguranca, consentimento e decisao parental por item.
