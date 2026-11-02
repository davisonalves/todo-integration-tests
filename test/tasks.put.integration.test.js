const { afterEach, describe, expect, test } = require('@jest/globals');
const {
  BASE_URL,
  cleanupCreatedTasks,
  createTask,
  expectTaskShape,
  request
} = require('../helpers');

afterEach(cleanupCreatedTasks);

describe('PUT /api/tasks/:id', () => {
  test('atualiza titulo e estado da tarefa', async () => {
    const created = await createTask('antes');
    const response = await request(BASE_URL)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: '  depois  ', completed: true });

    expect(response.status).toBe(200);
    expectTaskShape(response.body, { title: 'depois', completed: true });
    expect(response.body.id).toBe(created.body.id);
    expect(response.body.created_at).toBe(created.body.created_at);
  });

  test.each([
    ['identificador zero', '0', { title: 'valida', completed: false }],
    [
      'identificador acima do BIGINT',
      '9223372036854775808',
      { title: 'valida', completed: false }
    ],
    ['titulo ausente', '1', { completed: false }],
    ['titulo longo demais', '1', { title: 't'.repeat(201), completed: false }],
    ['completed ausente', '1', { title: 'valida' }],
    ['completed como texto', '1', { title: 'valida', completed: 'true' }],
    ['corpo como array', '1', [{ title: 'valida', completed: true }]]
  ])('rejeita %s com 400', async (_scenario, id, body) => {
    const response = await request(BASE_URL)
      .put(`/api/tasks/${id}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  test('retorna 404 para tarefa inexistente', async () => {
    const response = await request(BASE_URL)
      .put('/api/tasks/9223372036854775807')
      .send({ title: 'valida', completed: false });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa nao encontrada.' });
  });
});
