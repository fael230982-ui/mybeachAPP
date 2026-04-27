# Update 2 de Implementacao - MyBeach-Cidadao

Data: 2026-04-12
Modulo: `mybeach-cidadao`

## Pasta compartilhada verificada nesta rodada

Documento novo lido:

- `MYBEACH-MOBILE-STATUS-IMPLEMENTACAO-UPDATE-4-2026-04-12.md`

## Melhorias executadas

- fila offline agora usa:
  - `attempts`
  - `nextRetryAt`
  - `lastError`
- retry da fila agora respeita backoff exponencial
- sincronizacao interrompe corretamente em `401/403`
- aba `Conta` agora exibe detalhes da fila offline
- historico recente local de alertas mantido no app
- `API base URL` continua configuravel e persistida no proprio app
- suite local de testes adicionada em `scripts/run-tests.js`

## Cobertura local adicionada

Checks executados por `npm test`:

- normalizacao de status legados para status canonicos
- normalizacao de tipos legados para tipos canonicos
- delay de retry com backoff exponencial
- teto de delay de retry
- deduplicacao de alertas na fila offline

## Validacao final desta rodada

- `npm test`: ok
- `npm run lint`: ok
- `npx tsc --noEmit`: ok
