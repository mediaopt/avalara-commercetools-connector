import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../errors/custom.error';

export const testConnectionController = async (data: {
  env?: string;
  creds?: {
    username?: string;
    password?: string;
  };
  logging?: {
    enabled?: boolean;
    level?: string;
  };
}) => {
  if (!data || !data?.creds?.username || !data?.creds?.password || !data?.env) {
    throw new CustomError(400, 'Missing required data!');
  }
  const client = new AvaTaxClient(
    avaTaxConfig(data?.env || '', data?.logging?.enabled, data?.logging?.level)
  ).withSecurity(data?.creds);

  return await client.ping();
};

export const postTestConnection = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const dataTestConnection = await testConnectionController(request?.body);
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
