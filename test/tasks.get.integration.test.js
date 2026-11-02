const { afterEach, describe, expect, test } = require('@jest/globals');
const {
  BASE_URL,
  cleanupCreatedTasks,
  createTask,
  expectTaskShape,
  request
} = require('./helpers');

afterEach(cleanupCreatedTasks);

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
