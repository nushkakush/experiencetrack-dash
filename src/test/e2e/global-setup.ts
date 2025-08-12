/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up authentication state if needed
  // This could involve logging in and saving the auth state
  // For now, we'll just ensure the app is accessible
  
  try {
    await page.goto('http://localhost:8080');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Save authentication state if needed
    // await page.context().storageState({ path: 'playwright/.auth/user.json' });
    
    Logger.getInstance().info('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
