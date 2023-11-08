import { Response } from 'express';
import { ResponseInterfaceError } from '../interfaces/response.interface';

/**
 * Send a success response to the client
 *
 * @param {Response} response Express response
 * @param {number} statusCode The status code of the operation
 * @param {Array<unknown>} errors The update actions that were made in the process
 * @returns Success response with 200 status code and the update actions array
 */
export const apiError = (
  statusCode: number,
  errors: Array<unknown>,
  response: Response
) => {
  const responseBody = {} as ResponseInterfaceError;

  if (errors) {
    responseBody.errors = errors;
  }

  response.status(statusCode).json({
    ...responseBody,
  });
};
