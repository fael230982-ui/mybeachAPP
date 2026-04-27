# MYBEACH-CIDADAO - Status v0.1.2

Data: 2026-04-27

## Resumo

- Versao interna preparada: `v0.1.2`.
- Contrato acompanhado: `API Mbeach 1.3`.
- Repositorio: https://github.com/fael230982-ui/mybeachAPP

## Melhorias executadas

- Adicionada renovacao de sessao autenticada via `/auth/refresh` na tela Conta.
- Mantida preservacao do usuario atual ao renovar token de acesso.
- Ajustado calculo de expiracao para usar `exp` do JWT quando disponivel ou `expires_in_seconds` quando necessario.
- Atualizada rastreabilidade interna exibida no app para `v0.1.2`.
- Corrigido rotulo do modo Kids remoto para API 1.3.
- Atualizados testes locais para cobrir modo remoto Kids 1.3, politica de foto infantil e refresh de sessao.

## Validacao local

- `npm test`: ok.
- `npm run validate`: ok.
- Lint: ok dentro de `npm run validate`.
- Typecheck: ok dentro de `npm run validate`.
- Varredura simples por segredos: sem ocorrencias.
- Build de distribuicao: nao aplicavel enquanto nao houver script dedicado no projeto.

## Pendencias ainda existentes

- Validar fluxo real de `/auth/refresh` com usuario de homologacao e backend ativo.
- Validar abertura do app em dispositivo fisico.
- Validar login, aceite LGPD, mapa, mare, comercios, alertas e Kids em ambiente real.
- Confirmar politica juridica e operacional antes de liberar upload de foto infantil.
- Criar script de build de distribuicao quando o processo de release estiver definido.
