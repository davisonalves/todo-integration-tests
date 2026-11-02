const path = require('node:path');
const { Network, GenericContainer, Wait } = require('testcontainers');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

module.exports = async function setup() {
  const network = await new Network().start();
  const database = await new PostgreSqlContainer('postgres:16-alpine')
    .withNetwork(network)
    .withNetworkAliases('db')
    .withDatabase('todo')
    .withUsername('todo')
    .withPassword('todo')
    .start();

  const appImage = await GenericContainer
    .fromDockerfile(path.resolve(__dirname, '../todo-app'))
    .build('todo-integration-tests-app');

  const app = await appImage
    .withNetwork(network)
    .withExposedPorts(3000)
    .withEnvironment({
      DATABASE_URL: 'postgres://todo:todo@db:5432/todo',
      PORT: '3000'
    })
    .withWaitStrategy(Wait.forHttp('/api/tasks', 3000))
    .start();

  process.env.BASE_URL = `http://${app.getHost()}:${app.getMappedPort(3000)}`;
  global.__TODO_TEST_NETWORK__ = network;
  global.__TODO_TEST_DATABASE__ = database;
  global.__TODO_TEST_APP__ = app;
};
