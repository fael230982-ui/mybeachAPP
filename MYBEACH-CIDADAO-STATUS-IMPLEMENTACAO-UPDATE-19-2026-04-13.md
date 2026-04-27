# MYBEACH-CIDADAO - Status Implementacao Update 19

Data: 2026-04-13

## O que entrou nesta rodada

- revisao da nova OpenAPI publicada em `RAFIELS-MYBEACH\API\API Mbeach 1.0.txt`
- ajuste da camada `services/kids.ts` para o contrato real atualmente disponivel
- alinhamento dos tipos de crianca em `types/api.ts`
- atualizacao da leitura de capacidade kids no app do responsavel

## Contrato real identificado hoje

A OpenAPI atual ja publicou:

- `GET /children/`
- `POST /children/`
- `GET /children/{child_id}`
- `PUT /children/{child_id}`
- `DELETE /children/{child_id}`
- `POST /children/{child_id}/photo`

## Ponto importante

O contrato publicado hoje ainda nao traz:

- consentimento parental remoto
- conteudo infantil remoto
- revisao de publicacao infantil
- notificacoes parentais remotas

## Resultado pratico

O `MYBEACH-CIDADAO` agora reconhece corretamente este estado intermediario:

- fluxo local seguro continua ativo
- perfis infantis remotos ja podem ser integrados pelo endpoint `children`
- o restante do fluxo kids segue aguardando endpoints oficiais
