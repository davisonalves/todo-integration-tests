# Testes de integracao do todo-app

Suite Jest + Supertest para validar endpoints, status HTTP e corpos de resposta da API descrita em `../todo-app/API.md`.

## Executar os testes

Os testes usam Testcontainers para iniciar um PostgreSQL descartavel. A API em `../todo-app` e iniciada como um processo Node local, e o Jest so executa quando ela estiver pronta. E necessario Node.js 20 ou superior, Docker com uma API compativel e as dependencias da aplicacao instaladas:

```bash
npm test
```

```bash
cd ../todo-app && npm install
```

O container do banco e encerrado automaticamente ao final dos testes, inclusive quando a suite falha.

## Executar na pipeline

Para validar somente o método HTTP alterado, execute o script correspondente. Cada comando também roda `routes.integration.test.js`. `npm test` e `test:release` executam a suíte completa:

```bash
npm run test:get
npm run test:post
npm run test:put
npm run test:delete
```

Na pipeline de release, execute a suite completa:

```bash
npm run test:release
```

Os testes removem as tarefas que criam, inclusive quando falham parcialmente.
