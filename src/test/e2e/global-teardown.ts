/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Clean up any test data or resources
  Logger.getInstance().info('🧹 Global teardown completed');
}

export default globalTeardown;
