/**
 * Test setup file for TailwindCSS MCP Server tests
 * This file is run before each test suite
 */

import { vi } from 'vitest';

// Mock global console methods during tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

// Mock timers for testing time-dependent functionality
vi.useFakeTimers({
  shouldAdvanceTime: true,
});

// Set up global test environment variables
process.env.NODE_ENV = 'test';
process.env.TAILWIND_DOCS_URL = 'https://tailwindcss.com';

// Global test utilities
export const createMockDate = (timestamp: number = Date.now()) => {
  return new Date(timestamp);
};

export const advanceTime = (ms: number) => {
  vi.advanceTimersByTime(ms);
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.useRealTimers();
});