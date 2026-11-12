export const MC_API_URLS = [
  'https://mc-api.australia-southeast1.gcp.commercetools.com',
  'https://mc-api.europe-west1.gcp.commercetools.com',
  'https://mc-api.us-central1.gcp.commercetools.com',
  'https://mc-api.eu-central-1.aws.commercetools.com',
  'https://mc-api.us-east-2.aws.commercetools.com',
  'https://mc-api.cn-northwest-1.aws.commercetools.cn',
] as const;

/**
 * Name of the commercetools custom field holding the Avalara tax code on a
 * custom shipping method (resource type `shipping`). Fixed: the connector adds
 * this field to every existing `shipping` Type at post-deploy, and removes it
 * by the same name at pre-undeploy, so it must not vary between deployments.
 */
export const CUSTOM_SHIPPING_TAX_CODE_FIELD = 'avalaraTaxCode';

/** Avalara tax code applied when no shipping tax code could be resolved. */
export const FALLBACK_SHIPPING_TAX_CODE = 'FR010000';
