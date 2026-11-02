const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

const ROOT_DIRECTORY = path.resolve(__dirname, '..');
const APP_DIRECTORY = path.resolve(ROOT_DIRECTORY, '../todo-app');
const JEST_EXECUTABLE = path.join(ROOT_DIRECTORY, 'node_modules/jest/bin/jest.js');
const APP_READY_TIMEOUT_MS = 60_000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getAvailablePort() {
  const server = net.createServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return port;
}

async function waitForApp(app, url) {
  const deadline = Date.now() + APP_READY_TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    if (app.exitCode !== null) {
      throw new Error(`A API encerrou antes de ficar pronta (codigo ${app.exitCode}).`);
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        return;
      }
      lastError = new Error(`A API respondeu com HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(`A API nao ficou pronta em ${APP_READY_TIMEOUT_MS} ms: ${lastError.message}`);
}

async function stopApp(app) {
  if (app.exitCode !== null || app.signalCode !== null) {
    return;
  }

  const exited = new Promise((resolve) => app.once('exit', resolve));
  app.kill('SIGTERM');

  const stopped = await Promise.race([
    exited.then(() => true),
    delay(5_000).then(() => false)
  ]);

  if (!stopped) {
    app.kill('SIGKILL');
    await exited;
  }
}

async function run() {
  let database;
  let app;

  try {
    database = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('todo')
      .withUsername('todo')
      .withPassword('todo')
      .start();

    const port = await getAvailablePort();
    app = spawn(process.execPath, ['server.js'], {
      cwd: APP_DIRECTORY,
      env: {
        ...process.env,
        DATABASE_URL: database.getConnectionUri(),
        PORT: String(port)
      },
      stdio: 'inherit'
    });

    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForApp(app, `${baseUrl}/api/tasks`);

    const requestedTestFiles = process.argv.slice(2);
    const testFiles = requestedTestFiles.length > 0
      ? requestedTestFiles
      : (process.env.JEST_TEST_FILES || '').split(/\s+/).filter(Boolean);
    const result = spawnSync(
      process.execPath,
      [JEST_EXECUTABLE, '--runInBand', ...testFiles],
      {
        cwd: ROOT_DIRECTORY,
        env: { ...process.env, BASE_URL: baseUrl },
        stdio: 'inherit'
      }
    );

    if (result.error) {
      throw result.error;
    }

    return result.status ?? 1;
  } finally {
    try {
      if (app) {
        await stopApp(app);
      }
    } finally {
      if (database) {
        await database.stop();
      }
    }
  }
}

run()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error('Falha ao executar os testes de integracao:', error);
    process.exitCode = 1;
  });
