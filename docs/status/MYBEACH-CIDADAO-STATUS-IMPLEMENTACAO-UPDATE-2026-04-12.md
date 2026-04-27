# Status de Implementacao - MyBeach-Cidadao

Data: 2026-04-12
Modulo: `mybeach-cidadao`

## O que foi acrescentado nesta rodada

- sessao migrada de `AsyncStorage` para `expo-secure-store`
- fila offline local para:
  - criacao de alerta
  - `PUT /locations/ping`
- sincronizacao automatica da fila quando o app volta para foreground
- endurecimento do contrato local para absorver aliases de status e tipo vindos do ecossistema
- destaque visual do logo MyBeach nas telas principais
- credito visual da Rafiels na tela de login

## Contrato operacional adotado

Status canonicos:

- `REPORTED`
- `ACCEPTED`
- `IN_PROGRESS`
- `RESOLVED`
- `FALSE_ALARM`

Tipos canonicos:

- `DROWNING`
- `MEDICAL`
- `LOST_CHILD`

## Aliases absorvidos no app

Status:

- `ABERTO`, `NOVO`, `PENDING`, `PENDENTE`, `RECEIVED` -> `REPORTED`
- `DISPATCHED`, `ASSIGNED`, `ASSUMIDO` -> `ACCEPTED`
- `EM_ANDAMENTO`, `EM_ATENDIMENTO`, `EM_DESLOCAMENTO` -> `IN_PROGRESS`
- `ENCERRADO`, `FINALIZADO` -> `RESOLVED`
- `CANCELLED`, `FALSO_ALARME` -> `FALSE_ALARM`

Tipos:

- `SOS_AGUA`, `POSSIVEL_AFOGAMENTO` -> `DROWNING`
- `CHILD_MISSING` -> `LOST_CHILD`

## Estado tecnico atual

- `npx tsc --noEmit`: ok
- `npm run lint`: ok
- Expo Go ativo para testes locais

## Pendencias que ainda dependem de backend/ambiente

- confirmar lista oficial canonica de status entre backend, admin, mobile e cidadao
- validar login/cadastro contra ambiente real
- validar push remoto fora do Expo Go
- validar recebimento e evolucao de status real do alerta em operacao
