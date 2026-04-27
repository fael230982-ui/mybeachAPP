# Homologação

## Objetivo

Validar o app cidadão em dispositivo real antes de liberar uso operacional.

## Preparação

1. Instalar dependências com `npm install`.
2. Configurar `.env.local` a partir de `.env.example`.
3. Confirmar `EXPO_PUBLIC_API_BASE_URL` e, quando existir, `EXPO_PUBLIC_API_BASE_URL_HOMOLOG`.
4. Rodar validação mínima:

```bash
npm run validate
```

## Roteiro no app

- Abrir o app e confirmar splash.
- Aceitar Termo de Uso e Aviso de Privacidade.
- Fazer login com usuário cidadão válido.
- Confirmar tela inicial e praia selecionada.
- Validar seleção de cidade/praia.
- Validar mapa e permissão de localização.
- Validar maré.
- Validar comércios.
- Validar envio de alerta em rede normal.
- Validar comportamento offline e fila local.
- Validar tela Conta, health check e troca de ambiente.
- Validar consentimento do responsável.
- Validar criação/sincronização de perfil infantil.
- Validar conteúdo Kids e notificações parentais.

## Critérios de aprovação

- `npm run validate` sem erro.
- Nenhum segredo publicado no repositório.
- App identifica claramente ambiente ativo.
- Fila offline aparece quando há pendência.
- Fluxos Kids operam remotamente com API 1.2 ou caem para fallback local seguro.
- Foto infantil permanece bloqueada até homologação jurídica e operacional.

## Evidências recomendadas

- Print da tela Conta com versão, API ativa e health checks.
- Resumo compartilhado pela própria tela Conta.
- Registro de data, aparelho, usuário de teste e ambiente usado.
