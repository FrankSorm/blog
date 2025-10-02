module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*.spec.ts'],
  //   moduleNameMapper: {
  //     '^(.*)\\.js$': '$1', // kvůli ESM importům v TS
  //   },
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/main.ts',
    '!src/**/app.module.ts',
    '!src/**/graphql.module.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  maxWorkers: 2,
};
