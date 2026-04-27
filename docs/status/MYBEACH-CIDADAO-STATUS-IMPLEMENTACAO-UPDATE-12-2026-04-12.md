## MYBEACH-CIDADAO - Status de Implementacao - Update 12

Data: 2026-04-12

Melhorias aplicadas nesta rodada:

- aceite LGPD e de termos passou a ser obrigatorio no primeiro acesso
- foi criada tela formal de `Termo de Uso e Aviso de Privacidade` em `app/privacy-consent.tsx`
- gate raiz do app agora bloqueia o uso sem aceite registrado
- aceite ficou versionado localmente em `stores/privacyStore.ts`
- tela `Conta` passou a exibir versao aceita, data do aceite e atalho para revisar os termos
- tela de autenticacao passou a deixar explicito que o uso depende do aceite previo

Estado tecnico apos a rodada:

- `npm test`: ok
- `npm run lint`: ok
- `npx tsc --noEmit`: ok

Observacoes operacionais:

- a versao atual do aceite esta em `LGPD_CONSENT_VERSION`
- esse gate prepara o app para futuras revisoes de termo com reaceite versionado
- ainda e recomendavel alinhar backend e area juridica para texto definitivo de politica, bases legais, controlador e encarregado
