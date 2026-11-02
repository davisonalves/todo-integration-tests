const request = require('supertest');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const createdTaskIds = new Set();

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

async function cleanupCreatedTasks() {
  for (const id of createdTaskIds) {
    const response = await request(BASE_URL).delete(`/api/tasks/${id}`);
    expect([204, 404]).toContain(response.status);
  }
  createdTaskIds.clear();
}

module.exports = {
  BASE_URL,
  cleanupCreatedTasks,
  createTask,
  expectTaskShape,
  request
};
