// Based on https://github.com/microsoft/playwright/discussions/10715?sort=top
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import { commonEnvironment } from './src/environments/environments.common';


interface AuthUserResult {
  fbase_key: string;
  value: object;
}

const isAuthUserResult = (result: AuthUserResult): boolean => {
  return result && result.fbase_key && !!result.value;
};

const dbName = 'firebaseLocalStorageDb';
const dbVersion = 1;

const storeName = 'firebaseLocalStorage';
const keyPath = 'fbase_key';

const domError = (error: DOMException | null): string => {
  if (error === null) {
    return 'undefined';
  }
  return `${error.name}: ${error.message}`;
};

// Call within globalSetup to capture auth from signed-in page
export const captureAuthFrom = async (page: Page, storage: string) => {
  try {
    const result = await page.evaluate(evalReadAuthUser, {
      dbName,
      dbVersion,
      storeName,
      apiKey: commonEnvironment.firebase.apiKey
    });
    if (!isAuthUserResult(result)) {
      throw 'Is not auth user result';
    }
    const dirName = path.dirname(storage);
    const mkdir = util.promisify(fs.mkdir);
    if (!fs.existsSync(dirName)) {
      await mkdir(dirName).catch((e) => {
        console.log(e);
      });
    }
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`${storage}_IndexedDB.json`, JSON.stringify(result));
  } catch (error) {
    console.error('Unable to get auth user from IndexedDb', error);
    throw error;
  }
};

const authUserResultDict = new Map<string, AuthUserResult>();

// Call with beforeEach to reuse stored auth
export const addAuthTo = async (page: Page, storage: string) => {
  let authUserResult = authUserResultDict.get(storage);
  if (authUserResult === undefined) {
    const readFile = util.promisify(fs.readFile);
    const authUserResultString = await readFile(`${storage}_IndexedDB.json`, 'utf8');
    if (!authUserResultString) {
      return;
    }
    const authUserResultParsed: AuthUserResult = JSON.parse(authUserResultString);
    if (!isAuthUserResult(authUserResultParsed)) {
      console.log('Invalid index db file');
      return;
    }
    authUserResult = authUserResultParsed;
    authUserResultDict.set(storage, authUserResult);
  }

  // Blackhole routes so we can load a page (and avoid a roundtrip with the server),
  // which provides a context for IndexedDB to run, which will otherwise fail.
  const allRoutes = '**/*';
  await page.route(allRoutes, (route) => {
    void route.fulfill({ body: '' });
  });

  // Route name doesn't matter
  await page.goto('/void');

  try {
    await page.evaluate(evalSetAuthUser, {
      dbName,
      dbVersion,
      storeName,
      keyPath,
      authUserResult
    });
  } catch (error) {
    console.error('Unable to set auth user in IndexedDb', error);
  }

  // Un-blackhole routes
  await page.unroute(allRoutes);
};

// Read Firebase auth user from IndexedDB (run within page.evaluate)
type EvalReadAuthUserArgs = {
  dbName: string;
  dbVersion: number;
  storeName: string;
  apiKey: string;
};
const evalReadAuthUser = async ({
  dbName,
  dbVersion,
  storeName,
  apiKey
}: EvalReadAuthUserArgs): Promise<AuthUserResult> => {
  return new Promise<AuthUserResult>((resolve, reject) => {
    const openReq = indexedDB.open(dbName, dbVersion);

    openReq.onerror = () => {
      reject(new Error(`Error opening IndexedDB database: ${domError(openReq.error)}`));
    };

    openReq.onsuccess = () => {
      const db = openReq.result;

      db.onerror = () => {
        reject(new Error('Database error'));
      };

      const readTxn = db.transaction(storeName, 'readonly');
      const objStore = readTxn.objectStore(storeName);

      const objName = `firebase:authUser:${apiKey}:[DEFAULT]`;
      const getRequest = objStore.get(objName);

      getRequest.onerror = () => {
        reject(new Error(`Error getting data: ${domError(getRequest.error)}`));
      };

      getRequest.onsuccess = () => {
        resolve(getRequest.result);
        return;
      };
    };
  });
};

// Sets Firebase auth user in IndexedDB (run within page.evaluate)
type EvalSetAuthUserArgs = {
  dbName: string;
  dbVersion: number;
  storeName: string;
  keyPath: string;
  authUserResult: AuthUserResult;
};
const evalSetAuthUser = async ({
  dbName,
  dbVersion,
  storeName,
  keyPath,
  authUserResult
}: EvalSetAuthUserArgs): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const openReq = indexedDB.open(dbName, dbVersion);

    openReq.onerror = () => {
      reject(new Error(`Error opening IndexedDB database: ${domError(openReq.error)}`));
    };

    openReq.onupgradeneeded = () => {
      const db = openReq.result;
      db.createObjectStore(storeName, { keyPath });
    };

    openReq.onsuccess = () => {
      const db = openReq.result;

      db.onerror = () => {
        reject(new Error('Database error'));
      };

      const addTxn = db.transaction(storeName, 'readwrite');

      addTxn.onerror = () => {
        reject(new Error(`add transaction error: ${domError(addTxn.error)}`));
      };

      addTxn.oncomplete = () => {
        resolve();
      };

      const objStore = addTxn.objectStore(storeName);
      const addReq = objStore.add(authUserResult);

      addReq.onerror = () => {
        reject(new Error(`Error adding auth user: ${domError(addReq.error)}`));
      };

      addReq.onsuccess = () => {
        console.log('Successfully added request');
      };
    };
  });
};
