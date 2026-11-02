const { afterEach, describe, expect, test } = require('@jest/globals');
const {
  BASE_URL,
  cleanupCreatedTasks,
  createTask,
  expectTaskShape,
  request
} = require('./helpers');

const MAX_BODY_SIZE = 1024 * 1024;

afterEach(cleanupCreatedTasks);

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
