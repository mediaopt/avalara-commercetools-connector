import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { assertError, assertString } from '../utils/assert.utils';
import {
  createAvalaraEntityUseCodeFields,
  createAvalaraHashedCartField,
  createCategoryTaxCodeFields,
  createShippingTaxCodeFields,
  createCartUpdateExtension,
} from './actions';
import { testConnectionController } from '../controllers/test.connection.controller';
import { logger } from '../utils/logger.utils';

const CONNECT_APPLICATION_URL_KEY = 'CONNECT_SERVICE_URL';

async function postDeploy(properties: Map<string, unknown>): Promise<void> {
  const applicationUrl = properties.get(CONNECT_APPLICATION_URL_KEY);

  assertString(applicationUrl, CONNECT_APPLICATION_URL_KEY);

  const apiRoot = createApiRoot();
  await createCartUpdateExtension(apiRoot, applicationUrl);
  await createAvalaraEntityUseCodeFields(apiRoot);
  await createShippingTaxCodeFields(apiRoot);
  await createCategoryTaxCodeFields(apiRoot);
  await createAvalaraHashedCartField(apiRoot);
  const testConnection = await testConnectionController({
    logging: {
      enabled: true,
      level: '0',
    },
  });
  testConnection.authenticated
    ? logger.info('Your Avalara credentials are valid!')
    : logger.warn(
        'Your Avalara credentials are invalid! Please check your credentials and redeploy.'
      );
}

async function run(): Promise<void> {
  try {
    const properties = new Map(Object.entries(process.env));
    await postDeploy(properties);
  } catch (error) {
    assertError(error);
    process.stderr.write(`Post-deploy failed: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
