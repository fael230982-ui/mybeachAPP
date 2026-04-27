# MYBEACH-CIDADAO - Status Implementacao Update 20

Data: 2026-04-13

## O que entrou nesta rodada

- login e leitura de usuario alinhados ao `GET /users/me`
- exposicao de `email_verified` e `legacy_role` na tela de conta
- integracao hibrida de perfis infantis remotos via `children`
- leitura de `birth_date` refletida no fluxo do responsavel
- revisao final da pasta compartilhada antes da publicacao das pendencias do backend

## Resultado pratico

O `MYBEACH-CIDADAO` agora opera em estado intermediario mais realista:

- autenticacao remota oficial
- perfis infantis remotos oficiais
- fallback local preservado para consentimento, conteudo e notificacoes enquanto o backend nao publica esses contratos
