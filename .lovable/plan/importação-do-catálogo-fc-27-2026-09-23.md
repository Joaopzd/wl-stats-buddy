# Importação do catálogo FC 27

## Objetivo
Criar um endpoint seguro que importe `imports/players.csv` para `fc27_ratings` em lotes de 500 registros.

## Implementação
- Criar um endpoint público `POST /api/public/seed-fc27-ratings` no runtime suportado pelo aplicativo.
- Exigir o cabeçalho `x-import-secret` e validar o segredo `IMPORT_SECRET` antes de qualquer leitura ou gravação.
- Baixar o CSV do bucket privado `imports`, converter os campos informados e fazer upsert por `id`.
- Retornar a quantidade importada ou o ponto exato de falha.
- Manter a função administrativa isolada do navegador e sem expor credenciais.

## Observação técnica
Novas Edge Functions não são suportadas nesta arquitetura. O endpoint terá o mesmo fluxo e contrato, mas usará a URL publicada do aplicativo em vez de `/functions/v1/...`.

## Validação
- Confirmar que a rota compila e responde apenas a POST.
- Confirmar que requisições sem o segredo correto recebem 401.
