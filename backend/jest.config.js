/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@scalar/express-api-reference$": "<rootDir>/test-stubs/scalar.js",
  },
}
