import { Page, test } from '@playwright/test';

const ignoredConsoleLines = new Set([
  'Successfully added request',
  '[webpack-dev-server] Live Reloading enabled.',
  'WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.',
  'Angular is running in development mode. Call enableProdMode() to enable production mode.'
]);

export const handleBrowserConsoleLogs = (page: Page) => {
  page.on('console', (msg) => {
    if (!ignoredConsoleLines.has(msg.text())) {
      console.log(msg.text());
    }
    test.expect(msg.type()).not.toEqual('error');
  });
};
