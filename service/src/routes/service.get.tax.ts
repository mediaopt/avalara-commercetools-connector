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
import { testConnection } from '../avalara/requests/actions/test.connection';


export async function cartUpdate(req: Request, res: Response) {
  try {
    // Get credentials and configuration
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );

    if (req.body?.testConnection) {
      logger.info('Test connection call')
      const authenticated = await testConnection(req.body);
      const payload: any = {
        authenticated: authenticated
      }
      if (req.body?.id) {
        payload.id = req.body?.id
      }
      return res.status(200).send(payload)

    } else if (req.body?.checkAddress) {
      logger.info('Check address call')
      const validationInfo = await checkAddress(
        req.body
      );

      const payload: any = {
        valid: validationInfo?.valid, 
      }
      if (req.body?.id) {
        payload.id = req.body?.id
      }
      if (!validationInfo?.valid) {
        payload.message = validationInfo?.errorMessage
        return res.status(200).send(payload)  
      }
      payload.address = validationInfo?.address
      return res.status(200).send(payload)  
    }

    const { creds, originAddress, avataxConfig } = setUpAvaTax(settings);

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
          {
            creds: creds,
            address: shippingAddress(cart?.shippingAddress),
            config: avataxConfig
          }
        );

        const valid = validationInfo?.valid;

        if (!valid) {
          logger.info('Invalid address');
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
          logger.info('Cart update tax extension executed');
          res.status(200).send(postProcessing(cart, response));
        }
      );
    } else {
      logger.info('Cart update tax extension was not executed');
      return res.status(200).json();
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({
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
