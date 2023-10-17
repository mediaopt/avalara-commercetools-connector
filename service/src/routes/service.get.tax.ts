import { logger } from '../utils/logger.utils';
import { getTax } from '../avalara/requests/actions/get.tax';
import { postProcessing } from '../avalara/requests/postprocess/postprocess.get.tax';
import { getData } from '../client/create.client';
import * as http from 'node:https';
import { checkAddress } from '../avalara/requests/actions/check.address';
import { Cart } from '@commercetools/platform-sdk';
import { shippingAddress } from '../avalara/utils/shipping.address';
import { Request, Response } from 'express';
import { setUpAvaTax } from '../utils/avatax.utils';

export async function cartUpdate(req: Request, res: Response) {
  try {
    logger.info('Cart update extension executed');
    // Get credentials and configuration
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );

    const { creds, originAddress, avataxConfig } = setUpAvaTax(settings, http);

    const cart: Cart = req.body?.resource?.obj;

    const taxCalculationAllowed = settings.taxCalculation.includes(
      cart?.shippingAddress?.country
    );

    if (
      taxCalculationAllowed &&
      cart?.shippingAddress &&
      cart?.lineItems &&
      cart?.shippingInfo
    ) {
      // Validate address if address validation is activated

      if (settings.addressValidation) {
        const validationInfo = await checkAddress(
          creds,
          shippingAddress(cart?.shippingAddress),
          avataxConfig
        );

        const valid = validationInfo?.valid;

        if (!valid) {
          return res.status(400).json({
            errors: [
              {
                code: 'InvalidInput',
                message: validationInfo?.errorMessage || '',
              },
            ],
          });
        }
      }
      // If address was valid or address validation was desctivated calculate tax
      return await getTax(cart, creds, originAddress, avataxConfig).then(
        (response) => {
          res.status(200).send(postProcessing(cart, response));
        }
      );
    } else {
      res.status(200).json();
    }
  } catch (e) {
    logger.error(e);
    res.status(400).json({
      errors: [
        {
          code: 'General',
          message:
            'Internal server error, please check your address or try again later',
        },
      ],
    });
  }
}
