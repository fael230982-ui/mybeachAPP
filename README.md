# MyBeach Cidadao

Aplicativo Expo do modulo cidadao do ecossistema MyBeach.

## Configuracao

Defina as variaveis abaixo antes de iniciar o app:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.mybeach.com.br
EXPO_PUBLIC_API_ACCESS_TOKEN=seu_token_de_acesso
EXPO_PUBLIC_CITIZEN_USER_ID=uuid_do_cidadao
```

O app nao embarca mais token master no codigo. Os endpoints protegidos so funcionam com token configurado no ambiente.

## LGPD e perfis infantis

- o primeiro acesso exige aceite versionado do Termo de Uso e do Aviso de Privacidade
- a base tecnica para `Area Kids` foi criada em modo protegido
- perfis infantis locais nascem sem foto e sem visibilidade publica
- consentimento do responsavel e versionado separadamente antes de qualquer fluxo infantil
- texto juridico definitivo ainda deve ser validado com controlador, encarregado e assessoria juridica

## Scripts

```bash
npm install
npm run lint
npx tsc --noEmit
npx expo start
```

## Estrutura principal

- `services/`: integracoes tipadas com backend
- `types/`: contratos locais da API
- `stores/`: estado compartilhado da praia selecionada
- `app/(tabs)/`: telas principais
