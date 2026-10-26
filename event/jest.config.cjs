module.exports = {
  displayName: 'Tests Typescript Application - Event',
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['<rootDir>/tests/setup-tests.ts', 'dotenv/config'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  // The Connect build container reports the host's CPU count but is capped to far
  // less memory, so an unbounded worker pool gets OOM-killed. Cap it explicitly.
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  collectCoverage: true,
  collectCoverageFrom: [
        "src/avalara/**/*.ts",
        "src/client/data.client.ts",
        "src/controllers/**/*.ts",
        "src/connector/actions.ts",
    ],
};
