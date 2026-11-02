# Testes de integracao do todo-app

Suite Jest + Supertest para validar endpoints, status HTTP e corpos de resposta da API descrita em `../todo-app/API.md`.

## Executar os testes

O Jest usa Testcontainers para iniciar um PostgreSQL descartavel e a API em `../todo-app` em containers conectados pela mesma rede. E necessario Node.js 20 ou superior e Docker com uma API compativel:

```bash
npm test
```

Os containers e a rede sao encerrados automaticamente ao final dos testes.

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
