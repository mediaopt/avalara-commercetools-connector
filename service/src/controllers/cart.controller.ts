import { getData } from '../client/create.client';
import CustomError from '../errors/custom.error';
import { Resource } from '../interfaces/resource.interface';
import { setUpAvaTax } from '../utils/avatax.utils';
import { Cart } from '@commercetools/platform-sdk';
import { logger } from '../utils/logger.utils';
import { getTax } from '../avalara/requests/actions/get.tax';
import { postProcessing } from '../avalara/requests/postprocess/postprocess.get.tax';
import { hashCart } from '../utils/hash.utils';

export async function createUpdate(resource: Resource) {
  try {
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );
    const { creds, originAddress, avataxConfig } = setUpAvaTax(settings);

    const cartDraft = JSON.parse(JSON.stringify(resource));
    const cart: Cart = cartDraft?.obj;

    const taxCalculationAllowed: boolean = settings.taxCalculation.includes(
      cart?.shippingAddress?.country
    );

    if (
      taxCalculationAllowed &&
      cart?.shippingAddress &&
      cart?.lineItems.length !== 0 &&
      cart?.shippingInfo &&
      hashCart(cart) !== cart?.custom?.fields?.avahash
    ) {
      const updateActions = await getTax(
        cart,
        creds,
        originAddress,
        avataxConfig
      ).then((response) => postProcessing(cart, response));
      return { statusCode: 200, actions: updateActions };
    } else {
      logger.info('Cart update tax extension was not executed');
      return { statusCode: 200 };
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        statusCode: 400,
        errors: [
          {
            code: 'General',
            message: error.message,
          },
        ],
      };
    } else {
      throw new CustomError(400, 'Internal Server Error');
    }
  }
}

// Controller for update actions
// const update = (resource: Resource) => {};

/**
 * Handle the cart controller according to the action
 *
 * @param {string} action The action that comes with the request. Could be `Create` or `Update`
 * @param {Resource} resource The resource from the request body
 * @returns {Promise<object>} The data from the method that handles the action
 */
export const cartController = async (action: string, resource: Resource) => {
  switch (action) {
    case 'Create': {
      const data = await createUpdate(resource);
      return data;
    }
    case 'Update': {
      const data = await createUpdate(resource);
      return data;
    }
    default:
      throw new CustomError(
        500,
        `Internal Server Error - Resource not recognized. Allowed values are 'Create' or 'Update'.`
      );
  }
};
