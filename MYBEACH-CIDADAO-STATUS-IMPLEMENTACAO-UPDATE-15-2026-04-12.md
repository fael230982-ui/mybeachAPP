## MYBEACH-CIDADAO - Status de Implementacao - Update 15

Data: 2026-04-12

Melhorias aplicadas nesta rodada:

- fluxo infantil foi ajustado para decisao do responsavel item a item
- conteudo infantil agora nasce como `DRAFT_PRIVATE`
- quando houver pedido de publicacao, o item vai para `AWAITING_GUARDIAN_APPROVAL`
- decisao do responsavel ficou binaria por item: autoriza ou nao autoriza
- aprovacao passa a registrar `GUARDIAN_APPROVED_FOR_PUBLICATION`
- rejeicao passa a registrar `REJECTED_BY_GUARDIAN`
- tela `Conta` foi alinhada para `Salvar rascunho privado` e `Pedir publicacao`

Estado tecnico apos a rodada:

- `npm test`: ok
- `npm run lint`: ok
- `npx tsc --noEmit`: ok

Observacoes operacionais:

- o fluxo ficou mais coerente com notificacao e supervisao parental por publicacao
- a publicacao continua apenas modelada localmente e ainda depende de backend e operacao para existir em producao
