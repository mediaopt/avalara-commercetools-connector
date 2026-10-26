process.env.ENABLE_NEW_JSX_TRANSFORM = 'true';

/**
 * @type {import('@jest/types').Config.ProjectConfig}
 */
module.exports = {
  preset: '@commercetools-frontend/jest-preset-mc-app/typescript',
  // The Connect build container reports the host's CPU count but is capped to far
  // less memory, so an unbounded worker pool gets OOM-killed. Cap it explicitly.
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
};
