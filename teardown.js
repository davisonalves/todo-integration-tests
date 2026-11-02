module.exports = async function teardown() {
  await global.__TODO_TEST_APP__?.stop();
  await global.__TODO_TEST_DATABASE__?.stop();
  await global.__TODO_TEST_NETWORK__?.stop();
};
