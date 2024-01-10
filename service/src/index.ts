import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import {
  createSessionMiddleware,
  CLOUD_IDENTIFIERS,
} from '@commercetools-backend/express';

// Import routes
import ServiceRoutes from './routes/service.router';

// Import logger
import { logger } from './utils/logger.utils';

import { readConfiguration } from './utils/config.utils';
import { errorMiddleware } from './middleware/error.middleware';

// Read env variables
readConfiguration();

const PORT = 8080;

// Create the express app
const app: Express = express();
app.disable('x-powered-by');

// Define configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  createSessionMiddleware({
    audience: 'https://ff70da18716e.ngrok.app/',
    issuer: CLOUD_IDENTIFIERS.GCP_EU,
  })
);

app.use(cors({ origin: '*.commercetools.com' }));

// Define routes
app.use('/service', ServiceRoutes);

// Global error handler
app.use(errorMiddleware);

// Listen the application
const server = app.listen(PORT, () => {
  logger.info(`⚡️ Service application listening on port ${PORT}`);
});

export default server;
