# MyBeach Cidadão

Aplicativo Expo do módulo cidadão do ecossistema MyBeach.

## Configuração

Copie `.env.example` para `.env.local` e defina as variáveis necessárias antes de iniciar o app:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.mybeach.com.br
EXPO_PUBLIC_API_ACCESS_TOKEN=seu_token_de_acesso
EXPO_PUBLIC_CITIZEN_USER_ID=uuid_do_cidadao
```

O app não embarca token master no código. Endpoints protegidos funcionam com sessão autenticada ou token configurado no ambiente.

## LGPD e perfis infantis

- o primeiro acesso exige aceite versionado do Termo de Uso e do Aviso de Privacidade
- a base técnica para `Área Kids` foi criada em modo protegido
- perfis infantis locais nascem sem foto e sem visibilidade pública
- consentimento do responsável é versionado separadamente antes de qualquer fluxo infantil
- texto jurídico definitivo ainda deve ser validado com controlador, encarregado e assessoria jurídica

## Scripts

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run validate
npx expo start
```

## Estrutura principal

- `services/`: integrações tipadas com backend
- `types/`: contratos locais da API
- `stores/`: estado compartilhado da praia selecionada
- `app/(tabs)/`: telas principais
- `docs/`: histórico técnico, handoffs, pendências e roteiro

## Documentação

- [Setup](docs/SETUP.md)
- [Homologação](docs/HOMOLOGACAO.md)
- [Roadmap](ROADMAP.md)
- [Checklist](CHECKLIST.md)
- [Contribuição](CONTRIBUTING.md)
