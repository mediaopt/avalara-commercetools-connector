import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../errors/custom.error';
import { ValidatedAddressInfo } from 'avatax/lib/models/ValidatedAddressInfo';
import { createApiRoot, getData } from '../client/create.client';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

export const checkAddressController = async (
  data: {
    creds?: {
      username?: string;
      password?: string;
    };
    env?: string;
    address: AddressInfo;
    logging?: {
      enabled?: boolean;
      level?: string;
    };
  },
  apiRoot: ByProjectKeyRequestBuilder
): Promise<{
  valid?: boolean;
  address?: ValidatedAddressInfo[];
  errorMessages?: Array<any>;
  addressValidation?: boolean;
}> => {
  if (
    !data?.address ||
    (!data?.address?.line1 && !data?.address?.city && !data?.address?.region) ||
    (!data?.address?.line1 && !data?.address?.postalCode)
  ) {
    throw new CustomError(400, 'Bad request: Missing address');
  }
  if (data?.creds && data?.env) {
    const client = new AvaTaxClient(
      avaTaxConfig(data?.env, data?.logging?.enabled, data?.logging?.level)
    ).withSecurity(data?.creds);
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
  }
  const settings = await getData(
    'avalara-commercetools-connector',
    apiRoot
  ).then((res) => res.settings);
  if (!settings?.addressValidation) {
    return {
      addressValidation: settings?.addressValidation,
    };
  }
  const client = new AvaTaxClient(
    avaTaxConfig(
      settings?.env ? 'production' : 'sandbox',
      settings?.enableLogging,
      settings?.logLevel
    )
  ).withSecurity({
    username: settings?.accountNumber,
    password: settings?.licenseKey,
  });
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
  next: NextFunction,
  apiRoot: ByProjectKeyRequestBuilder = createApiRoot()
) => {
  try {
    const dataCheckAddress = await checkAddressController(
      request?.body,
      apiRoot
    );
    response.status(200).json(dataCheckAddress);
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(400, error.message));
    } else {
      next(error);
    }
  }
};
