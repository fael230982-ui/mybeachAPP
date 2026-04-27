# Setup

## Pré-requisitos

- Node.js compatível com Expo SDK 54
- npm
- Expo CLI via `npx expo`
- Acesso ao backend MyBeach quando for validar integração remota

## Instalação

```bash
npm install
```

## Ambiente

Crie `.env.local` a partir de `.env.example`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.mybeach.com.br
EXPO_PUBLIC_API_BASE_URL_HOMOLOG=
EXPO_PUBLIC_API_ACCESS_TOKEN=
EXPO_PUBLIC_CITIZEN_USER_ID=
```

Observações:

- `EXPO_PUBLIC_API_BASE_URL` define a API ativa inicial.
- `EXPO_PUBLIC_API_BASE_URL_HOMOLOG` habilita o preset de homologação na tela Conta.
- `EXPO_PUBLIC_API_ACCESS_TOKEN` é opcional quando o usuário faz login pelo app.
- `EXPO_PUBLIC_CITIZEN_USER_ID` atende fluxos legados que dependem de usuário fixo.

## Execução

```bash
npx expo start
```

Atalhos úteis:

```bash
npm run android
npm run ios
npm run web
```

## Validação local

```bash
npm test
npm run lint
npm run typecheck
```

O projeto ainda não possui script `build`. Para release mobile, usar fluxo Expo/EAS quando a configuração de distribuição estiver fechada.
