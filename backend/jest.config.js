const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/*.spec.js", "**/*.test.js"], // Mapeia apenas arquivos .spec.ts ou .test.ts
  clearMocks: true,                             // Reseta o histórico de chamadas dos mocks a cada teste
  restoreMocks: true,                           // Restaura implementações originais espionadas (spyOn)
};