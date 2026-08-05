/** @type {import('jest').Config} */
const expoPreset = require('jest-expo/jest-preset');

const sharedConfig = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleNameMapper: {
        ...expoPreset.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@assets/(.*)$': '<rootDir>/assets/$1',
    },
};

module.exports = {
    projects: [
        {
            ...sharedConfig,
            displayName: 'unit',
            testMatch: [
                '<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)',
                '<rootDir>/tests/unit/**/*.test.[jt]s?(x)',
            ],
        },
        {
            ...sharedConfig,
            displayName: 'integration',
            testMatch: ['<rootDir>/tests/integration/**/*.test.[jt]s?(x)'],
        },
    ],
};
