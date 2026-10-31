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

## Executar localmente

Requer Node.js 20+ e a API acessivel em `http://localhost:3000` (por exemplo, iniciada pelo Compose do todo-app):

```bash
npm ci
npm test
```

Para usar outra URL, defina `BASE_URL`:

```bash
BASE_URL=http://localhost:8080 npm test
```

Os testes removem as tarefas que criam, inclusive quando falham parcialmente.
