module.exports = {
  displayName: 'Tests Typescript Application - Service',
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['<rootDir>/tests/setup-tests.ts', 'dotenv/config'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};
