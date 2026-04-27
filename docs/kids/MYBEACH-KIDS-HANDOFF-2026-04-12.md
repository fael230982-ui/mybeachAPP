# MYBEACH-KIDS - Handoff Tecnico

Data: 2026-04-12

## Recomendacao

Minha recomendacao e manter `MyBeach Kids` ou `MyBeach Edu` como app separado do `MyBeach Cidadao`, mas conectado ao mesmo ecossistema.

Motivos:

- separa publico infantil do fluxo operacional adulto
- reduz risco LGPD/ECA
- facilita UX propria para criancas
- evita mistura com alertas reais e dados sensiveis do modulo cidadao
- permite supervisao completa do responsavel

## Objetivo do app

O `MyBeach Kids` deve ser um modulo educativo e ludico, nao uma rede social infantil.

Funcionalidades recomendadas:

- missoes
- descobertas
- conquistas
- selos
- educacao ambiental
- interacao sempre mediada por responsavel

Funcionalidades que nao devem nascer abertas:

- feed publico infantil
- chat
- comentarios
- ranking publico
- foto de crianca liberada por padrao
- geolocalizacao publica

## Integracao com ecossistema

Apps envolvidos:

- `MYBEACH-CIDADAO`: responsavel, consentimentos, monitoramento, aprovacao
- `MYBEACH-KIDS`: experiencia infantil
- `BACKEND`: vinculos, conteudo, auditoria, notificacoes
- `MYBEACH-ADMIN`: moderacao, suporte, trilha administrativa

Modelo de conexao recomendado:

- conta principal do responsavel existe no ecossistema
- responsavel vincula uma ou mais criancas
- crianca usa app infantil em perfil protegido
- qualquer pedido de publicacao gera notificacao para o responsavel
- sem aprovacao do responsavel nao publica

## Regras de privacidade e compliance

Base minima obrigatoria:

- melhor interesse da crianca e do adolescente
- consentimento parental versionado quando aplicavel
- coleta minima de dados
- perfil infantil privado por padrao
- foto infantil bloqueada por padrao
- publicacao publica so apos autorizacao explicita do responsavel
- trilha de auditoria de consentimento e aprovacao
- canal de exclusao e revogacao

## Estados recomendados para conteudo infantil

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

Fluxo:

1. crianca cria conteudo
2. conteudo nasce privado ou em rascunho
3. se houver pedido de publicacao, vai para aprovacao parental
4. responsavel recebe notificacao
5. responsavel decide `sim` ou `nao`
6. somente depois disso o backend pode publicar

## Estruturas ja modeladas no modulo cidadao

Referencias no repositorio `mybeach-cidadao`:

- [types/api.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\types\api.ts:1)
- [stores/kidsSafetyStore.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\stores\kidsSafetyStore.ts:1)
- [constants/legal.ts](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\constants\legal.ts:1)
- [app/kids-guardian-consent.tsx](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\app\kids-guardian-consent.tsx:1)
- [app/(tabs)/account.tsx](C:\Users\Pc Rafa\Desktop\mybeach-cidadao\app\(tabs)\account.tsx:1)

Tipos ja preparados:

- `GuardianConsentRecord`
- `ChildLinkedProfile`
- `ChildContentDraft`
- `GuardianNotificationItem`
- `ChildContentStatus`

## O que o desenvolvedor do MYBEACH-KIDS deve fazer

1. criar app separado com branding infantil
2. usar login/vinculo via conta do responsavel
3. consumir ou preparar contrato backend para perfis infantis
4. implementar modulos:
   - descobertas
   - missoes
   - conquistas
   - perfil infantil protegido
5. manter toda descoberta como privada por padrao
6. quando houver acao de publicar, enviar pedido de autorizacao ao responsavel
7. nunca liberar foto infantil publica por padrao
8. nunca criar feed publico sem aprovacao juridica e operacional formal

## Recomendacao de telas do app infantil

- onboarding infantil simples
- selecao de perfil infantil vinculado
- home com missoes do dia
- descobertas privadas
- conquistas e selos
- pedido de publicacao
- tela de conteudo aguardando responsavel

## Backend recomendado

Entidades minimas:

- guardian_accounts
- child_profiles
- guardian_child_links
- child_content
- child_content_reviews
- guardian_notifications
- consent_versions
- consent_acceptances

Campos importantes:

- `guardian_id`
- `child_profile_id`
- `content_status`
- `requested_publication_at`
- `reviewed_by_guardian_at`
- `guardian_decision`
- `consent_version`
- `audit_log`

## Admin recomendado

O admin deve conseguir:

- ver vinculos responsavel-crianca
- ver conteudo infantil e status
- ver historico de aprovacao/rejeicao
- despublicar conteudo
- atender exclusao e revogacao

## Direcao visual

As imagens de referencia em `C:\Users\Pc Rafa\Desktop\mybeach-cidadao\kids` sugerem bem a linguagem visual:

- praia
- descoberta
- selo
- missao
- tons claros e ludicos

Recomendacao:

- manter isso no `MYBEACH-KIDS`
- nao levar esse visual para o `MYBEACH-CIDADAO`

## Minha recomendacao final

Sim, gerar esse handoff para outro desenvolvedor e tocar `MYBEACH-KIDS` como produto separado e o melhor caminho.

Alternativa menos recomendada:

- manter tudo dentro do `MYBEACH-CIDADAO`

Eu nao recomendo isso porque piora separacao de publico, UX e compliance.
