module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.spec.js', '**/*.test.js'],
  clearMocks: true,
  restoreMocks: true
}
