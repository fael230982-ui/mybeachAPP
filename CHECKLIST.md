# Checklist

## Antes de push

- [x] Rodar testes aplicáveis.
- [x] Rodar lint.
- [x] Rodar typecheck.
- [x] Rodar `npm run validate`.
- [ ] Rodar build quando existir script dedicado no projeto.
- [x] Verificar que segredos, chaves, tokens e credenciais não foram publicados.
- [x] Preservar autoria e documentos do projeto.

## Antes de homologação

- [ ] Validar abertura do app e splash.
- [ ] Validar aceite LGPD e reabertura após aceite.
- [ ] Validar login do cidadão.
- [ ] Validar cadastro do cidadão quando o backend estiver disponível.
- [ ] Validar praia selecionada e persistência local.
- [ ] Validar alertas, incluindo fila offline.
- [ ] Validar mapa e permissão de localização.
- [ ] Validar maré.
- [ ] Validar comércios.
- [ ] Validar área Kids e consentimento do responsável.
- [ ] Validar tela Conta, diagnóstico, health check e troca de ambiente.
- [ ] Preencher checklist interno de homologação na tela Conta.
- [ ] Revisar textos, acentuação e experiência do usuário.
- [ ] Confirmar variáveis de ambiente necessárias.
- [ ] Validar integração com API em ambiente apropriado.

## Antes de release

- [ ] Atualizar `CHANGELOG.md`.
- [ ] Revisar pendências conhecidas.
- [ ] Confirmar build de distribuição.
- [ ] Registrar versão e data da publicação.
