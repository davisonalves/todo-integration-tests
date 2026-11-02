const { expect, test } = require('@jest/globals');
const { BASE_URL, request } = require('./helpers');

test('retorna 404 e JSON para endpoint inexistente em /api', async () => {
  const response = await request(BASE_URL).get('/api/not-a-route');

  expect(response.status).toBe(404);
  expect(response.body).toEqual({ error: 'Rota nao encontrada.' });
});
