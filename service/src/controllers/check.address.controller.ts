import AvaTaxClient from "avatax/lib/AvaTaxClient";
import { AddressInfo } from "avatax/lib/models/AddressInfo"
import { avaTaxConfig } from "../avalara/utils/avatax.config";
import { NextFunction, Request, Response } from "express";
import CustomError from "../errors/custom.error";
import { ValidatedAddressInfo } from "avatax/lib/models/ValidatedAddressInfo";

export const checkAddressController = async (data: {
    creds: {
        username: string, 
        password: string
    }, 
    env: string, 
    address: AddressInfo
}): Promise<{
  valid: boolean, 
  address?: ValidatedAddressInfo[] | undefined, 
  errorMessage?: any
}> => {
    const client = new AvaTaxClient(
        avaTaxConfig(data?.env)
      ).withSecurity(data?.creds);
    
      const addressValidation = await client.resolveAddress(data?.address);
    
      const validatedAddress = addressValidation?.validatedAddresses;
    
      const messages: any = addressValidation?.messages;
    
      let error = false;
    
      messages ? (error = messages[0].severity === 'Error') : false;
    
      if (!error) {
        return {
          valid: true,
          address: validatedAddress,
        };
      }
    
      return {
        valid: false,
        errorMessage: messages[0]?.details,
      };

}

export const postCheckAddress = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const dataCheckAddress = await checkAddressController(request?.body)
    response.status(200).json(dataCheckAddress);
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(500, error.message));
  } else {
      next(error)
  }
  }

}