import { Browser, chromium, FullConfig } from '@playwright/test';
import { captureAuthFrom } from './firebaseAuth';
import { AdminUser, AllUsers, TestUser } from './LoginData';

async function login(user: TestUser, browser: Browser, url: string) {
  const authenticationContext = await browser.newContext();

  const authenticationPage = await authenticationContext.newPage();
  await authenticationPage.goto(url);

  const [popupPage] = await Promise.all([
    authenticationPage.waitForEvent('popup'),
    authenticationPage.getByRole('button', { name: 'Sign In with Azure' }).click()
  ]);

  await popupPage.waitForLoadState('load', { timeout: 60 * 1000 });

  await Promise.all([
    authenticationPage.waitForNavigation(),
    popupPage.getByText(user.email).click()
  ]);

  const contexts = browser.contexts();
  const appPage = contexts[0].pages()[0];

  await appPage.waitForLoadState();

  await captureAuthFrom(authenticationPage, user.storage);
  await appPage.context().storageState({ path: `${user.storage}.json` as string });
  await browser.close();
}

async function globalSetup(config: FullConfig) {
  const { baseURL, headless } = config.projects[0].use;
  const testMatch = config.projects[0].testMatch;
  const users =
    typeof testMatch === 'string' && testMatch.includes('Prod') ? [AdminUser] : AllUsers;
  for (const u of users) {
    let numberOfFailures = 0;
    let loggedIn = false;
    while (!loggedIn && numberOfFailures < 3) {
      const browser = await chromium.launch({ headless: headless });
      loggedIn = true;
      await login(u, browser, `${baseURL!}/login`).catch((e) => {
        console.log(e);
        numberOfFailures++;
        loggedIn = false;
        browser.close();
      });
    }

    if (!loggedIn) {
      throw new Error(`Cannot authenticate as ${u.name}`);
    }
  }
}

export default globalSetup;
