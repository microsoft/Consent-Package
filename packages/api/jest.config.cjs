/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
};

module.exports = config;
