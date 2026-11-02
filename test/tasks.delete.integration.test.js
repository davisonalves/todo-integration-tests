const { afterEach, describe, expect, test } = require('@jest/globals');
const {
  BASE_URL,
  cleanupCreatedTasks,
  createTask,
  request
} = require('./helpers');

afterEach(cleanupCreatedTasks);

describe('DELETE /api/tasks/:id', () => {
  test('remove tarefa e retorna 204 sem corpo', async () => {
    const created = await createTask('para remover');
    const response = await request(BASE_URL)
      .delete(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');

    const lookup = await request(BASE_URL)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 'valida', completed: false });
    expect(lookup.status).toBe(404);
    expect(lookup.body).toEqual({ error: 'Tarefa nao encontrada.' });
  });

  test.each([
    ['identificador zero', '0'],
    ['identificador acima do BIGINT', '9223372036854775808']
  ])('rejeita %s com 400', async (_scenario, id) => {
    const response = await request(BASE_URL).delete(`/api/tasks/${id}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Identificador de tarefa invalido.'
    });
  });

  test('retorna 404 para tarefa inexistente', async () => {
    const response = await request(BASE_URL)
      .delete('/api/tasks/9223372036854775807');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa nao encontrada.' });
  });
});
