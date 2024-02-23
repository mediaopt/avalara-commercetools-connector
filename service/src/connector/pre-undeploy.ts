import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { assertError } from '../utils/assert.utils';
import {
  deleteAvalaraEntityUseCodeFields,
  deleteAvalaraHashedCartField,
  deleteTaxCodeFields,
  deleteCartUpdateExtension,
} from './actions';

async function preUndeploy(): Promise<void> {
  const apiRoot = createApiRoot();
  await deleteCartUpdateExtension(apiRoot);
  await deleteAvalaraEntityUseCodeFields(apiRoot);
  await deleteTaxCodeFields(apiRoot);
  await deleteAvalaraHashedCartField(apiRoot);
}

async function run(): Promise<void> {
  try {
    await preUndeploy();
  } catch (error) {
    assertError(error);
    process.stderr.write(`Pre-undeploy failed: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
