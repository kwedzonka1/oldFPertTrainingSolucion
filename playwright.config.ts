import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import { NormalUser } from './LoginData';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
// https://github.com/microsoft/playwright/issues/13673
// Apperantly setting viewPort in config does not work as it looks like and each browser has its own, default viewport size.
// Value below will be used as default value for each browser.
const globalViewPort = {
  width: 1920,
  height: 1080
};

const config: PlaywrightTestConfig = {
  globalSetup: require.resolve('./global-setup'),
  testDir: './tests',
  testIgnore: '*Prod.spec.ts',
  /* Maximum time one test can run for. */
  timeout: 80 * 1000,
  globalTimeout: 100 * 60 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  //forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  //retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
 // workers: process.env.CI ? 1 : 1,
  /* Second argument is set to 1 instead of undefined, because of our problem with authentication and being unable to get all required data stored
  in json file (issue described in readme.md). In serial mode which we use in our tests there are multiple workers assigned locally to tests which
  results in the situation where if one test fails, all tests after it are beeing skipped. In order to allow all tests to be run we had to disable
  parallelism on workers, not on tests.*/
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['./MyTrxReporter', { outputFile: 'playwrightResults.trx' }],
    //['junit', { outputFile: 'playwrightResults.xml' }],
    //[
     // 'html',
     // { open: process.env.CI ? 'never' : 'on-failure', outputFolder: 'playwright-report/e2e' }
   // ]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    baseURL: 'http://localhost:4200',
    ignoreHTTPSErrors: true,
    headless: true,
    viewport: globalViewPort,
    screenshot: 'only-on-failure',
    // Tell all tests to load signed-in state from 'storageState.json'.
    storageState: `${NormalUser.storage}.json`,
    // launchOptions: {
    //   slowMo: 1000
    // }
    timezoneId: 'Europe/Warsaw'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: globalViewPort
      }
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: globalViewPort
      }
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: globalViewPort
      }
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: [
    // {
    //   command: process.env.CI
    //     ? `firebase emulators:start --import ./e2eDB --project ${process.env.FIREBASE_PROJECT_ID} --token "${process.env.FIREBASE_TOKEN}"`
    //     : 'firebase emulators:start --import ./e2eDB',
    //   url: 'http://127.0.0.1:4000/',
    //   cwd: '..',
    //   reuseExistingServer: !process.env.CI,
    //   timeout: 120000
    // },
    {
      command: 'npm run start-fake-auth',
      url: 'http://localhost:4200/',
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    }
  ]
};

export default config;
