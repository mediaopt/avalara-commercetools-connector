import { logger } from '../utils/logger.utils';
import { getTax } from '../avalara/requests/actions/get.tax';
import { postProcessing } from '../avalara/requests/postprocess/postprocess.get.tax';
import { getData } from '../client/create.client';
import { checkAddress } from '../avalara/requests/actions/check.address';
import { Cart } from '@commercetools/platform-sdk';
import { shippingAddress } from '../avalara/utils/shipping.address';
import { Request, Response } from 'express';
import { setUpAvaTax } from '../utils/avatax.utils';
import { testConnection } from '../avalara/requests/actions/test.connection';

async function isTestConnection(data: any) {
  if (data?.testConnection) {
    logger.info('Test connection call');
    return {
      authenticated: await testConnection(data),
    };
  }
}

async function isCheckAddress(data: any) {
  if (data?.checkAddress) {
    logger.info('Check address call');
    const validationInfo = await checkAddress(data);
    const payload: any = {
      valid: validationInfo?.valid,
    };
    if (!validationInfo?.valid) {
      payload.message = validationInfo?.errorMessage;
    } else {
      payload.address = validationInfo?.address;
    }
    return payload;
  }
}

export async function cartUpdate(req: Request, res: Response) {
  try {
    const connectionTestCall = await isTestConnection(req.body);
    const addressCheckCall = await isCheckAddress(req.body);

    if (connectionTestCall) {
      return res.status(200).send(connectionTestCall);
    } else if (addressCheckCall) {
      return res.status(200).send(addressCheckCall);
    }

    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );
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
      if (settings.addressValidation) {
        const validationInfo = await checkAddress({
          creds: creds,
          address: shippingAddress(cart?.shippingAddress),
          config: avataxConfig,
        });

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
