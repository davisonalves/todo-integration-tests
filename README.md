# Testes de integracao do todo-app

Suite Jest + Supertest para validar endpoints, status HTTP e corpos de resposta da API descrita em `../todo-app/API.md`.

## Executar com Docker Compose

O Compose cria a aplicacao a partir de `../todo-app`, inicia um PostgreSQL descartavel e so executa os testes quando a API estiver pronta:

```bash
docker compose up --build --exit-code-from integration-tests
```

`--exit-code-from` encerra os outros serviços quando os testes terminam e retorna o código de saída da suite. Para também remover os containers depois:

```bash
docker compose down
```

## Executar pelo npm

Os scripts npm executam a API, o banco e os testes pelo Docker Compose. Requer Node.js/npm e Docker com o plugin Compose:

```bash
npm test
```

## Executar na pipeline

Para validar somente o método HTTP alterado, execute o script correspondente. Cada comando também roda `routes.integration.test.js`. `npm test` e `test:release` executam a suíte completa:

```bash
npm run test:get
npm run test:post
npm run test:put
npm run test:delete
```

Na pipeline de release, execute a suíte completa:

```bash
npm run test:release
```

Os testes removem as tarefas que criam, inclusive quando falham parcialmente.
