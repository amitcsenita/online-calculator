const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir:       './tests/specs',
  fullyParallel: false,
  retries:       process.env.CI ? 1 : 0,
  reporter:      'list',
  timeout:       20000,
  use: {
    baseURL:    'http://localhost:3001',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'on-first-retry',
  },
  webServer: {
    command:             'node node_modules/serve/build/main.js . -p 3001 -n',
    url:                 'http://localhost:3001/todo.html',
    reuseExistingServer: true,
    timeout:             20000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
