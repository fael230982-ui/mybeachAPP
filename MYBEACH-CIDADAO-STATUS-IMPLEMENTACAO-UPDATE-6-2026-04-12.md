## MYBEACH-CIDADAO - Status de Implementacao - Update 6

Data: 2026-04-12

Melhorias aplicadas nesta rodada:

- fila offline ganhou leitura operacional mais clara com indicacao de quando o item esta pronto para sincronizar
- resumo da fila agora informa a proxima janela de retry de forma humana
- detalhes da fila na tela `Conta` passaram a mostrar o estado de retry de cada item com linguagem mais direta
- banner da home passou a refletir tambem a proxima janela de retry quando existir fila pendente

Estado tecnico apos a rodada:

- `npm test`: ok
- `npm run lint`: ok
- `npx tsc --noEmit`: ok

Observacoes operacionais:

- quando a fila estiver elegivel para reenvio, o app passa a mostrar `Pronto para sincronizar`
- quando ainda houver espera, o app mostra a janela estimada de retry, por exemplo `Novo retry em 2 min`
