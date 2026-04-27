# Evidência de Homologação

Data: 2026-04-27

## Identificação

- App: MYBEACH-CIDADAO
- Repositório: https://github.com/fael230982-ui/mybeachAPP
- Contrato de API: API Mbeach 1.3
- Versão interna alvo: v0.1.2
- Ambiente: definir durante o teste em dispositivo real
- Usuário de teste: definir durante o teste em dispositivo real

## Validação técnica local

- `npm run validate`: ok em 2026-04-27
- Varredura simples por segredos: sem ocorrências em 2026-04-27
- Build de distribuição: não aplicável enquanto não houver script dedicado
- Renovação de sessão via `/auth/refresh`: cobertura adicionada em teste local

## Checklist funcional

- [ ] Splash e abertura do app
- [ ] Aceite LGPD
- [ ] Login do cidadão
- [ ] Tela inicial e praia selecionada
- [ ] Seleção de cidade/praia
- [ ] Mapa e permissão de localização
- [ ] Maré
- [ ] Comércios e estado vazio
- [ ] Envio de alerta
- [ ] Fila offline
- [ ] Tela Conta e health check
- [ ] Troca de ambiente
- [ ] Consentimento do responsável
- [ ] Perfil infantil
- [ ] Conteúdo Kids
- [ ] Notificações parentais

## Pendências observadas durante homologação

- Preencher durante teste real.

## Evidências anexas recomendadas

- Print da tela Conta com rastreabilidade.
- Print do checklist interno preenchido.
- Print do endpoint ativo e health checks.
- Resumo compartilhado pela tela Conta.
