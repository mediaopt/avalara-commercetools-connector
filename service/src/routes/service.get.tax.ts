import { logger } from '../utils/logger.utils';
import { getTax } from '../avalara/requests/actions/get.tax';
import { postProcessing } from '../avalara/requests/postprocess/postprocess.get.tax';
import { getData } from '../client/create.client';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import * as http from 'node:https';
import { checkAddress } from '../avalara/requests/actions/check.address';
import { Cart } from '@commercetools/platform-sdk';
import { shippingAddress } from '../avalara/utils/shipping.address';
import { Request, Response } from 'express';

export async function cartUpdate(req: Request, res: Response) {
  try {
    logger.info('Cart update extension executed');
    // Get credentials and configuration
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );

    const creds = {
      username: settings.accountNumber,
      password: settings.licenseKey,
    };

    const originAddress = {
      line1: settings.line1,
      line2: settings.line2,
      line3: settings.line3,
      city: settings.city,
      postalCode: settings.postalCode,
      region: settings.region,
      country: settings.country,
    };

    const avataxConfig = avaTaxConfig(
      settings.env ? 'production' : 'sandbox',
      http
    );

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
