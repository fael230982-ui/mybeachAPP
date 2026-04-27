# Revisao do handoff do admin para MyBeach-Cidadao

Data: 2026-04-12
Origem analisada: `C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\MYBERACH-ADMIM-HANDOFF-MYBEACH-CIDADAO.md`
API analisada: `C:\Users\Pc Rafa\Desktop\RAFIELS-MYBEACH\API\Nova API com Identificação de bateria quem gerou evento e PUSH FIREBASE (3).txt`
Repositorio revisado: `mybeach-cidadao`

## Resumo executivo

O app ainda nao esta alinhado com o contrato operacional que o admin espera para alertas.
Hoje ele mistura interface demonstrativa com integracao parcial, possui credenciais sensiveis embarcadas no cliente e nao implementa um ciclo de vida de alerta confiavel para operacao real.

## Principais achados

### 1. Segredo critico exposto no app

Arquivo: `app/(tabs)/index.tsx`

- Existe um token master JWT hardcoded no app.
- O cliente mobile nao deve embarcar credencial com privilegio elevado.
- Se esse build circular, qualquer pessoa com acesso ao bundle consegue consumir endpoints protegidos como admin/master.

Impacto:
- comprometimento de seguranca do ecossistema
- risco de alteracao indevida de dados
- risco de abuso de endpoints internos

### 2. Payload de alerta inconsistente entre telas e componentes

Arquivos:
- `app/(tabs)/index.tsx`
- `app/components/BotaoSOS.tsx`
- `app/components/BotaoCrianca.tsx`

Problemas:
- `index.tsx` envia `SOS_AGUA` e `CRIANCA_PERDIDA`
- `BotaoSOS.tsx` envia `DROWNING` e `MEDICAL`
- `BotaoCrianca.tsx` envia `LOST_CHILD`

O admin pediu padronizacao de status e tipos; o proprio app hoje usa tres nomenclaturas diferentes para eventos parecidos.

Impacto:
- classificacao inconsistente no admin
- risco de dashboards e relatorios quebrarem por cardinalidade errada
- maior chance de backend precisar manter alias ou normalizacao artificial

### 3. Fluxo de emergencia sem retorno real de status operacional

Arquivo: `app/(tabs)/index.tsx`

- Depois de enviar o alerta, a UI assume sucesso local e mostra "Equipe a caminho".
- O app nao consulta o status retornado pelo backend, nao exibe `created_at`, nao exibe `id` do alerta e nao acompanha transicoes.
- O handoff do admin pede exatamente o oposto: enviado, recebido, assumido, encerrado.

Impacto:
- o usuario recebe uma promessa operacional que o backend pode nao ter confirmado
- o admin continua sem ciclo de vida confiavel para acompanhar

### 4. Falta de identificacao valida do solicitante

Arquivos:
- `app/(tabs)/index.tsx`
- `app/components/BotaoSOS.tsx`

Problemas:
- `index.tsx` envia `created_by_id: 'user-uuid'`
- `BotaoSOS.tsx` usa UUID fixo hardcoded
- `BotaoCrianca.tsx` nem envia `created_by_id`

Pela OpenAPI, `created_by_id` existe no `AlertCreate` e o admin explicitamente pediu identificacao minima de origem.

### 5. Campo `city_id` nao e enviado e contexto geografico continua fraco

Arquivo: `app/(tabs)/index.tsx`

- O app trabalha com cidade e praia no front, mas no envio do alerta so manda `beach_id`.
- O admin pediu `city_id` quando conhecido.
- A resposta da API de alerta suporta `city_id` no retorno, mas o app nao organiza esse contexto nem documenta regra de nulidade.

### 6. Componente de crianca perdida usa coordenada fake

Arquivo: `app/components/BotaoCrianca.tsx`

- Localizacao e simulada com `setTimeout`.
- Latitude e longitude sao fixas.
- Isso viola diretamente a expectativa do admin sobre coordenada valida e confiavel.

Impacto:
- polui mapa tatico
- degrada historico operacional
- pode gerar despacho em ponto errado

### 7. Mapa ainda esta em estado demonstrativo

Arquivo: `app/(tabs)/mapas.tsx`

- Existe botao SOS sem fluxo completo.
- Existe marcador fixo hardcoded.
- O botao de crianca perdida so dispara `Alert.alert`.

Esse modulo ainda nao representa um mapa operacional conectado ao ecossistema.

### 8. Store possui erro real de implementacao

Arquivo: `stores/beachStore.ts`

Problemas:
- referencia `pontosWeb`, mas a variavel criada foi `pontos`
- faz spread de `get().selectedBeach` em pontos onde o valor pode ser `null`

Resultado:
- `npx tsc --noEmit` falha
- ha risco de quebra e inconsistencias de estado

### 9. Projeto nao fecha em TypeScript

Checagem executada: `npx tsc --noEmit`

Erros relevantes:
- `stores/beachStore.ts`: referencia invalida e tipos inseguros
- `services/deviceUtils.ts`: handler de notificacao incompleto para a versao atual
- `app/(tabs)/index.tsx`: varios `fontWeight` invalidos e incompatibilidades de tipo
- `app/SplashScreenAnimada.tsx`: props sem tipagem

Conclusao:
- o app pode aparentar funcionar visualmente, mas o baseline tecnico ainda nao esta estavel

### 10. Notificacao push foi iniciada, mas nao integrada ao fluxo real

Arquivo: `services/deviceUtils.ts`

- Existe coleta de device push token
- nao existe fluxo visivel de login/identificacao do usuario
- nao existe chamada integrada para atualizar `/users/{user_id}/fcm-token`

Ou seja: a infraestrutura comecou, mas a integracao de negocio nao foi concluida.

### 11. Excessos de fallback e dados ficticios mascaram o estado real

Arquivos:
- `app/(tabs)/index.tsx`
- `stores/beachStore.ts`
- `app/(tabs)/mare.tsx`
- `app/(tabs)/mapas.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/comercios.tsx`

Ha varios textos, praias, comercio, mare, curiosidades e regras fabricados ou placeholders.
Isso e aceitavel para demonstracao visual, mas nao pode ser confundido com integracao pronta.

## Comparacao direta com o handoff do admin

### O que o admin pediu

- coordenada valida
- `city_id` quando conhecido
- `beach_id` quando conhecido
- identificacao minima do solicitante
- bateria quando fizer sentido
- tipos e status consistentes
- estrategia de retry/offline
- documentacao de campos nulos

### O estado atual do app

- coordenada: parcial, e fake em parte do fluxo
- `city_id`: ausente no envio
- `beach_id`: parcial
- identificacao do solicitante: inconsistente
- bateria: parcial
- tipos/status: inconsistentes
- retry/offline: inexistente
- documentacao de nulidade: inexistente

## Melhorias prioritarias

### Prioridade 0

1. Remover token master do cliente imediatamente.
2. Centralizar integracao de alertas em um unico servico.
3. Unificar tipos oficiais de alerta com backend e admin.
4. Parar de enviar coordenadas fake.

### Prioridade 1

1. Criar contrato local de `AlertCreate` e `AlertResponse` tipado.
2. Enviar sempre `created_by_id`, `beach_id` e `city_id` quando disponiveis.
3. Exibir status real retornado pela API em vez de mensagem otimista fixa.
4. Persistir `alert_id`, `status`, `created_at` e dados minimos do contexto da praia.

### Prioridade 2

1. Implementar regra de retry com idempotencia ou protecao contra duplicidade.
2. Implementar fila offline ou bloquear envio quando nao houver conectividade confiavel.
3. Integrar FCM token no fluxo real de usuario.
4. Substituir placeholders de mare, mapa e comercios por dados reais ou esconder sessoes ainda nao integradas.

### Prioridade 3

1. Corrigir todos os erros de TypeScript.
2. Reduzir logs de debug e mensagens locais exageradamente otimistas.
3. Separar codigo de demonstracao visual de codigo operacional.

## Recomendacao tecnica objetiva

O proximo passo correto nao e continuar espalhando fetches nos componentes.
O app precisa primeiro de uma camada unica de integracao com backend:

- `services/alerts.ts`
- `services/beaches.ts`
- `services/auth.ts`
- `types/api.ts`

Depois disso:

- telas chamam servicos
- payloads ficam unificados
- status e erros ficam rastreaveis
- o admin passa a enxergar eventos consistentes

## Conclusao

O modulo `mybeach-cidadao` ja tem uma base visual interessante e ja iniciou integracoes relevantes, mas ainda nao esta pronto para ser tratado como cliente operacional confiavel no ecossistema.
O principal problema nao e layout; e contrato, seguranca, consistencia de evento e confiabilidade de dados enviados ao backend/admin.
