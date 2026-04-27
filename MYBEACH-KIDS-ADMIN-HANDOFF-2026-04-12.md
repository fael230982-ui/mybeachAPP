# MYBEACH-KIDS - Admin Handoff

Data: 2026-04-12

## Objetivo

Este documento orienta o que o `MYBEACH-ADMIN` deve oferecer para operar com seguranca o ecossistema `MYBEACH-KIDS`.

Premissas:

- publico infantil exige controle reforcado
- responsavel continua sendo a conta principal
- publicacao infantil nao deve acontecer sem aprovacao do responsavel
- admin precisa ter visibilidade, moderacao e trilha de auditoria

## O papel do MYBEACH-ADMIN

O painel administrativo nao deve funcionar como aprovador principal da publicacao infantil no fluxo normal.

O papel principal do admin e:

- supervisao
- moderacao
- suporte
- auditoria
- bloqueio e contingencia

## Paineis recomendados

### 1. Painel de perfis infantis

Listagem com:

- id do perfil infantil
- nome de exibicao
- faixa etaria
- responsavel vinculado
- status do perfil
- foto habilitada ou nao
- visibilidade publica
- data de criacao

Acoes recomendadas:

- visualizar
- bloquear
- suspender
- solicitar revisao
- excluir logicamente

### 2. Painel de vinculos responsavel-crianca

Listagem com:

- responsavel
- crianca
- relacionamento informado
- consentimento vigente
- data do aceite

Acoes recomendadas:

- verificar vinculo
- invalidar vinculo
- sinalizar inconsistencias

### 3. Painel de conteudo infantil

Listagem com:

- titulo
- categoria
- perfil infantil
- responsavel
- status
- pedido de publicacao
- data de criacao
- data da decisao do responsavel

Estados esperados:

- `DRAFT_PRIVATE`
- `AWAITING_GUARDIAN_APPROVAL`
- `GUARDIAN_APPROVED_FOR_PUBLICATION`
- `PUBLISHED`
- `REJECTED_BY_GUARDIAN`

Acoes recomendadas:

- visualizar conteudo
- despublicar
- bloquear publicacao
- arquivar
- registrar incidente

### 4. Painel de consentimentos

Listagem com:

- versao do termo
- responsavel
- crianca vinculada quando houver
- data e hora do aceite
- identificador de auditoria

Acoes recomendadas:

- consultar
- exportar
- marcar para revisao juridica

### 5. Painel de auditoria

Eventos minimos:

- criacao de perfil infantil
- aceite do responsavel
- pedido de publicacao
- aprovacao do responsavel
- rejeicao do responsavel
- publicacao final
- despublicacao
- exclusao
- revogacao de consentimento

## Regras de moderacao recomendadas

### O que o admin deve bloquear

- foto infantil indevida
- conteudo com exposicao excessiva da crianca
- dados sensiveis
- localizacao indevida
- postagem sem aprovacao parental registrada
- qualquer publicacao fora da politica infantil

### O que o admin nao deve permitir

- liberar foto infantil manualmente sem politica aprovada
- publicar conteudo sem trilha de consentimento
- manter conteudo infantil publico diante de pedido de exclusao

## Alertas administrativos recomendados

O admin deve receber alertas para:

- tentativa de publicacao sem aprovacao
- conteudo infantil publicado com anomalia
- consentimento vencido ou inconsistente
- multiplos perfis infantis com dados conflitantes
- revogacao parental

## Busca e filtros importantes

Filtros minimos:

- por responsavel
- por perfil infantil
- por status do conteudo
- por periodo
- por versao de consentimento
- por conteudo publicado
- por conteudo rejeitado

## Exportacoes recomendadas

- relatorio de consentimentos
- relatorio de publicacoes infantis
- relatorio de rejeicoes parentais
- relatorio de auditoria por perfil infantil
- relatorio de exclusao e revogacao

## Integracoes esperadas

O admin deve conversar com:

- `BACKEND`
- `MYBEACH-CIDADAO`
- futuro `MYBEACH-KIDS`

Documentos correlatos:

- [MYBEACH-KIDS-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-HANDOFF-2026-04-12.md:1)
- [MYBEACH-KIDS-BACKEND-HANDOFF-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACH-KIDS-BACKEND-HANDOFF-2026-04-12.md:1)
- [MYBEACK-KIDS-STATUS-IMPLEMENTACAO-2026-04-12.md](C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBEACK-KIDS-STATUS-IMPLEMENTACAO-2026-04-12.md:1)

## Alinhamento com o status atual do app infantil

O documento mais recente do modulo `MYBEACK-KIDS` mostra que o app infantil ja existe como base local em Expo e ja usa:

- `Missoes`
- `Descobertas`
- `Conquistas`
- `Perfil Protegido`

O `MYBEACH-ADMIN` deve assumir que essa base visual e de fluxo vai evoluir para integracao real. Isso muda a prioridade do admin:

1. suportar contratos e auditoria primeiro
2. depois suportar moderacao operacional do conteudo infantil
3. por fim suportar relatorios e rotinas de suporte avancadas

## Recomendacao de implementacao para o MYBEACH-ADMIN

1. criar modulo `Kids`
2. criar listagem de perfis infantis
3. criar listagem de conteudo infantil
4. criar trilha de auditoria
5. criar acoes de despublicar, bloquear e arquivar
6. criar filtros e exportacoes
7. criar alertas administrativos

## Diretriz final

O `MYBEACH-ADMIN` deve nascer conservador:

- painel de supervisao primeiro
- moderacao forte
- tudo rastreavel
- sem excecao manual sem auditoria

Esse e o caminho mais seguro para suportar `MYBEACH-KIDS` sem perder controle operacional nem expor o ecossistema a risco regulatorio desnecessario.
