const request = require('supertest');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const createdTaskIds = new Set();
const MAX_BODY_SIZE = 1024 * 1024;

async function createTask(title) {
  const response = await request(BASE_URL)
    .post('/api/tasks')
    .send({ title });

  if (response.status === 201 && response.body.id) {
    createdTaskIds.add(response.body.id);
  }

  return response;
}

function expectTaskShape(task, { title, completed }) {
  expect(task).toEqual({
    id: expect.stringMatching(/^[1-9]\d*$/),
    title,
    completed,
    created_at: expect.any(String)
  });
  expect(new Date(task.created_at).toISOString()).toBe(task.created_at);
}

afterEach(async () => {
  for (const id of createdTaskIds) {
    const response = await request(BASE_URL).delete(`/api/tasks/${id}`);
    expect([204, 404]).toContain(response.status);
  }
  createdTaskIds.clear();
});

describe('GET /api/tasks', () => {
  test('lista tarefas como JSON e ordena as mais recentes primeiro', async () => {
    const older = await createTask(`older-${Date.now()}`);
    const newer = await createTask(`newer-${Date.now()}`);

    expect(older.status).toBe(201);
    expectTaskShape(older.body, { title: older.body.title, completed: false });
    expect(newer.status).toBe(201);
    expectTaskShape(newer.body, { title: newer.body.title, completed: false });

    const response = await request(BASE_URL).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(response.body)).toBe(true);

    const ids = response.body.map((task) => task.id);
    expect(ids.indexOf(newer.body.id)).toBeLessThan(ids.indexOf(older.body.id));
    for (const task of response.body) {
      expectTaskShape(task, {
        title: expect.any(String),
        completed: expect.any(Boolean)
      });
    }
  });
});

describe('POST /api/tasks', () => {
  test('cria uma tarefa, remove espacos nas pontas e retorna os valores padrao', async () => {
    const response = await createTask('  estudar integracao  ');

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expectTaskShape(response.body, {
      title: 'estudar integracao',
      completed: false
    });
  });

  test('aceita titulo no limite de 200 caracteres', async () => {
    const title = 't'.repeat(200);
    const response = await createTask(title);

    expect(response.status).toBe(201);
    expectTaskShape(response.body, { title, completed: false });
  });

  test.each([
    ['campo ausente', {}],
    ['titulo vazio', { title: '' }],
    ['titulo so com espacos', { title: '   \t  ' }],
    ['titulo acima do limite', { title: 't'.repeat(201) }],
    ['corpo nulo', null],
    ['corpo como array', ['titulo']]
  ])('rejeita %s com 400 e uma mensagem de erro', async (_scenario, body) => {
    const response = await request(BASE_URL)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  test('rejeita JSON malformado com 400', async () => {
    const response = await request(BASE_URL)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'JSON invalido.' });
  });

  test('rejeita tipo de conteudo diferente de JSON com 415', async () => {
    const response = await request(BASE_URL)
      .post('/api/tasks')
      .set('Content-Type', 'text/plain')
      .send('{"title":"tarefa"}');

    expect(response.status).toBe(415);
    expect(response.body).toEqual({
      error: 'O conteudo deve ser enviado como JSON.'
    });
  });

  test('rejeita corpo maior que 1 MiB com 413', async () => {
    const body = JSON.stringify({ title: 't'.repeat(MAX_BODY_SIZE) });
    const response = await request(BASE_URL)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: 'O corpo da requisicao excede o limite permitido.'
    });
  });
});

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

test('retorna 404 e JSON para endpoint inexistente em /api', async () => {
  const response = await request(BASE_URL).get('/api/not-a-route');

  expect(response.status).toBe(404);
  expect(response.body).toEqual({ error: 'Rota nao encontrada.' });
});
