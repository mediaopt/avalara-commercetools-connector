import { NextFunction, Request, Response } from 'express';
import { apiSuccess } from '../api/success.api';
import CustomError from '../errors/custom.error';
import { cartController } from './cart.controller';
import { logger } from '../utils/logger.utils';

/**
 * Exposed service endpoint.
 * - Receives a POST request, parses the action and the controller
 * and returns it to the correct controller. We should be use 3. `Cart`, `Order` and `Payments`
 *
 * @param {Request} request The express request
 * @param {Response} response The express response
 * @returns
 */
export const post = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  // Deserialize the action and resource from the body
  const { action, resource } = request.body;

  if (!action || !resource) {
    return next(new CustomError(400, 'Bad request - Missing body parameters.'));
  }

  if (resource.typeId === 'cart') {
    try {
      const data = await cartController(action, resource);
      if (data?.statusCode === 200) {
        apiSuccess(200, data?.actions, response);
        return;
      } else if (data?.error) {
        throw new CustomError(data.statusCode, data.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
        logger.error(error.stack);
        next(new CustomError(500, error.message));
      } else {
        next(error);
      }
    }
  } else {
    next(
      new CustomError(
        500,
        `Internal Server Error - Resource not recognized. Allowed values are 'cart'.`
      )
    );
  }
};
