import { Page, test as base } from '@playwright/test';
import { addAuthTo } from './firebaseAuth';
import { NormalUser } from './LoginData';
import { AdminUser } from './LoginData';
import { handleBrowserConsoleLogs } from './browserConsoleHandler';

// Fixture Declaration
type MyFixtures = {
  authenticatedPage: Page;
  authenticatedAsAdminPage: Page;
  sharedWindowLoggedPage: Page;
};

type SharedWindow = {
  page: Page;
};

// Extend base test by providing "authenticatedPage" and "authenticatedAsAdminPage".
export const test = base.extend<MyFixtures, { sharedWindow: SharedWindow }>({
  authenticatedPage: async ({ page }, use) => {
    const authenticatedPage = page;
    handleBrowserConsoleLogs(page);
    await addAuthTo(page, NormalUser.storage);
    await use(authenticatedPage);
  },

  authenticatedAsAdminPage: async ({ page }, use) => {
    const authenticatedAsAdminPage = page;
    handleBrowserConsoleLogs(page);
    await addAuthTo(page, AdminUser.storage);
    await use(authenticatedAsAdminPage);
  },

  sharedWindowLoggedPage: async ({ sharedWindow }, use) => {
    await use(sharedWindow.page);
  },

  sharedWindow: [
    async ({ browser }, use) => {
      const page = await browser.newPage();
      handleBrowserConsoleLogs(page);
      await addAuthTo(page, NormalUser.storage);
      use({ page });
    },
    { scope: 'worker' }
  ]
});

export { expect } from '@playwright/test';
