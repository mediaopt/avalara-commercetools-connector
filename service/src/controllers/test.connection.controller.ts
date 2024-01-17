import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../errors/custom.error';

export const testConnectionController = async (data: {
  logging: {
    enabled: boolean;
    level: string;
  };
}) => {
  const env = process.env.AVALARA_ENV || 'sandbox';
  const creds = {
    username: process.env.AVALARA_USERNAME as string,
    password: process.env.AVALARA_PASSWORD as string,
  };
  const client = new AvaTaxClient(
    avaTaxConfig(env, data.logging.enabled, data.logging.level)
  ).withSecurity(creds);

  return await client.ping();
};

export const postTestConnection = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    if (
      !request.body ||
      !request.body.logging ||
      !request.body.logging.enabled ||
      !request.body.logging.level
    ) {
      throw new CustomError(400, 'Bad request: missing required data.');
    }
    const dataTestConnection = await testConnectionController(request.body);
    response.status(200).json(dataTestConnection);
    return;
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(400, error.message));
    } else {
      next(error);
    }
  }
};
