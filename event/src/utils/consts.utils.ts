/**
 * Name of the commercetools custom field holding the Avalara tax code on a
 * custom shipping method (resource type `shipping`). Fixed: the service
 * application adds this field to every existing `shipping` Type at post-deploy,
 * and removes it by the same name at pre-undeploy, so it must not vary between
 * deployments.
 */
export const CUSTOM_SHIPPING_TAX_CODE_FIELD = 'avalaraTaxCode';

/** Avalara tax code applied when no shipping tax code could be resolved. */
export const FALLBACK_SHIPPING_TAX_CODE = 'FR010000';
