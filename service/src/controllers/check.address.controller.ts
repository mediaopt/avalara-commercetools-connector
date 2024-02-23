import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../errors/custom.error';
import { ValidatedAddressInfo } from 'avatax/lib/models/ValidatedAddressInfo';
import { getData } from '../client/data.client';

export const checkAddressController = async (data: {
  mcApp?: boolean;
  address: AddressInfo;
  logging?: {
    enabled?: boolean;
    level?: string;
  };
}): Promise<{
  valid?: boolean;
  address?: ValidatedAddressInfo[];
  errorMessages?: Array<any>;
  addressValidation?: boolean;
}> => {
  const env = process.env.AVALARA_ENV || 'sandbox';
  const creds = {
    username: process.env.AVALARA_USERNAME as string,
    password: process.env.AVALARA_PASSWORD as string,
  };

  if (
    !data?.address ||
    (!data?.address?.line1 && !data?.address?.city && !data?.address?.region) ||
    (!data?.address?.line1 && !data?.address?.postalCode)
  ) {
    throw new CustomError(400, 'Bad request: Missing address');
  }
  const settings = await getData('avalara-settings').then(
    (res) => res.settings
  );
  if (!data?.mcApp && !settings?.addressValidation) {
    return {
      addressValidation: settings?.addressValidation,
    };
  }
  const client = new AvaTaxClient(
    avaTaxConfig(
      env,
      data?.logging?.enabled ?? settings?.enableLogging,
      data?.logging?.level ?? settings?.logLevel
    )
  ).withSecurity(creds);
  const validation = await client.resolveAddress(data?.address);
  const validatedAddress = validation?.validatedAddresses;
  const error = validation?.messages?.find(
    (message) => message.severity === 'Error'
  )
    ? true
    : false;

  if (!error) {
    return {
      valid: true,
      address: validatedAddress,
    };
  }

  return {
    valid: false,
    errorMessages: validation?.messages?.filter(
      (message) => message.severity === 'Error'
    ),
  };
};

export const postCheckAddress = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const dataCheckAddress = await checkAddressController(request?.body);
    response.status(200).json(dataCheckAddress);
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(400, error.message));
    } else {
      next(error);
    }
  }
};
