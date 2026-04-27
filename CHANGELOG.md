# Changelog

## 2026-04-27 - Adoção da API Mbeach 1.2

- Adota contratos remotos de consentimento parental em `/kids/guardian-consents`.
- Adota conteúdo Kids remoto em `/kids/content`.
- Adota notificações parentais remotas em `/kids/guardian-notifications`.
- Adota registro remoto de aceite LGPD autenticado em `/auth/me/privacy-consent`.
- Passa a consultar política remota de foto infantil em `/children/{child_id}/photo-policy`, mantendo upload bloqueado por política conservadora.
- Atualiza diagnóstico Kids para API 1.2.

## 2026-04-27 - Organização e preparo para homologação

- Adiciona `.env.example`.
- Adiciona script `npm run typecheck`.
- Organiza documentos históricos em `docs/`.
- Adiciona `docs/SETUP.md` e `ROADMAP.md`.
- Amplia `CHECKLIST.md` para push, homologação e release.
- Melhora mensagens de erro de API e diagnóstico de ambiente.

## 2026-04-27

- Salva estado atual do projeto `MYBEACH-CIDADAO`.
- Adiciona documentação de autoria, contribuição, checklist e pendências operacionais.
- Mantém validações locais com teste, lint e typecheck.
