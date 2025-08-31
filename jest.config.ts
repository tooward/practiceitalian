import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
  ],
  resetMocks: true,
  clearMocks: true,
};

export default config;
