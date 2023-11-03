import AvaTaxClient from "avatax/lib/AvaTaxClient";
import { avaTaxConfig } from "../avalara/utils/avatax.config";
import { NextFunction, Request, Response } from "express";
import CustomError from "../errors/custom.error";


export const testConnectionController = async (data: {
    env: string, 
    creds: {
        username: string, 
        password: string
    }
}) => {
    const client = new AvaTaxClient(
        avaTaxConfig(data?.env))
        .withSecurity(data?.creds);

  return await client.ping();
}

export const postTestConnection = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const dataTestConnection = await testConnectionController(request?.body);
        response.status(200).json(dataTestConnection);
        return;
    } catch (error) {
        if (error instanceof Error) {
            next(new CustomError(500, error.message));
        } else {
            next(error)
        }
    }
}