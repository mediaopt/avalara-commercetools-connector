import { Router } from 'express';
import { logger } from '../utils/logger.utils';
import { getTax } from '../avalara/requests/actions/get-tax';
import { postProcessing } from '../avalara/requests/postprocess/postprocess-get-tax';
import { getData } from '../client/create.client';
import { avaTaxConfig } from '../avalara/utils/avatax-config';
import * as http from 'node:https';
import { checkAddress } from '../avalara/requests/actions/check-address';
import { Cart } from '@commercetools/platform-sdk';
import { shippingAddress } from '../avalara/utils/shipping-address';

const serviceRouter = Router();

serviceRouter.post('/get-tax', async (req, res) => {
  logger.info('Cart update extension executed');
  // Get credentials and configuration
  const creds = await getData('avalaraCreds');
  const ctConfig = await getData('avalaraConfiguration');
  const avataxConfig = avaTaxConfig(ctConfig.env, http);
  const cart: Cart = req.body?.resource?.obj;
  // Validate address if address validation is activated
  if (ctConfig.addressValidation) {
    const validationInfo = await checkAddress(
      creds,
      shippingAddress(cart?.shippingAddress!),
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
  return await getTax(cart, creds, avataxConfig)
    .then((response) => {
      res.status(200).send(postProcessing(cart, response));
    })
    .catch((e) => {
      console.log(e);
      res.status(500).json({
        errors: [
          {
            code: 'General',
            message: 'Internal server error',
          },
        ],
      });
    });
});

export default serviceRouter;
