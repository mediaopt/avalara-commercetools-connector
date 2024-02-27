This connector has `service` , `event` & `mc-app` applications.

# service

- this extension handles creation and update of carts, so that if a created or an updated cart is eligible for 
US/Canada sales tax calculation, external tax rates and tax amounts, calculated by the AvaTax service, will be applied to the cart.

- no AvaTax calculation will be applied if 
a cart does not have line items, or shipping address, or shipping method specified, or if the shipping address country is not US/Canada. Otherwise, `taxMode` will be automatically set by the extension to `externalAmount`. Line items + shipping, and hence also cart external tax amounts and rates, collected from the AvaTax service, will be set in the cart via corresponding cart update actions `setLineItemTaxAmount`, `setShippingMethodTaxAmount`, `setCartTotalTax`.

- the extension needs to add custom fields to the following resource types: `customer`, `category`, `shipping-method` and `order`. Thus, upon deploying the connector, all custom types created beforehand will be updated with connector's custom fields, used to store Avalara-related data, such as entity use code for a customer, tax code for shipping method and category, and a cart hash for a cart, which is used to prevent unnecessary calls to Avalara service. Apart from that, connector-own custom types for these resource types will be also created with configurable keys and names in connect.yaml, on condition that for the configured key the custom type had not existed before. Otherwise no new type will be created. That allows the merchant to have only one custom type with configurable key for several connectors.

- note that it is the responsibility of the merchant not to delete these custom fields himself (they always have the `avalara` prefix), and redeploy the connector in case the merchant has created a new type after the connector deployment and wishes to use it.

- there is also a possibility for specifying product-level tax codes. To this edge, a product attribute with name `avatax-code` must be created. It can be either unique for every variant or the same for each variant. The type of this attribute must be set to `text`. 

- this extension with the main route `/service` also has two additional subrouted endpoints for Avalara specific functionality: testing availability and credentials to the AvaTax Service under `/test-connection`, and validating addresses via the AvaTax Service under `/check-address`. `/test-connection` endpoint is only available while using mc-app. `/check-address` is used within mc-app for verifying the merchant's origin address, but it can also be used for validating shipping addresses in the frontend. In the latter case the frontend developer only needs to send an AvaTax formatted address to this endpoint, and the AvaTax credentials will be fetched by the extension automatically from the `service` application secured configuration. This endpoint requires an authorization with a json web token, fully described [here](https://github.com/mediaopt/avalara-commercetools-cofe-integration) with an implementation example. The request body has the following scheme:
```
    {
        address: {
            line1?: string, 
            line2?: string, 
            line3?: string, 
            city?: string, 
            region?: string, 
            postalCode?: string,
            country?: string
        }
    }
```
- Even if the address was given incompletely, but could be found by Avalara, it will be considered as valid, and a suggested full address info will be returned. If it could not be found by Avalara, a corresponding error will be returned. If the address validation was deactivated in the mc-app, no validation will be conducted, and an `addressValidation` parameter will be returned as `false`. The response body has a following scheme:
```
    {
        valid?: boolean;
        address?: ValidatedAddressInfo[];
        errorMessages?: Error[];
        addressValidation?: boolean;
    }
```
- AvaTax SDK provides a logging tool which we integrated to align with the setting of the mc-app. According to this setting, AvaTax request and response infos will be logged whenever `/service` endpoint or any of its subroutes are called. The logs are available under `Query logs` endpoint for a connector's deployment.  

# event

- this extension handles messages triggered by creating an order or updating an order status.

- messages of type `OrderCreated` or `OrderStateChanged` will be processed by the AvaTax service further and result in a status 200 response independent of AvaTax response.

- all other messages types will not be processed and will result in a status 200 response.

- in case of `OrderCreated`, if the shipping address country is not US or Canada, or if the disable document recording setting is activated, nothing will happen and a status 200 response will be returned. Otherwise a commit transaction call with the processed order information will be made to AvaTax service. In this case again the `avalara-tax-codes` custom type, described within the service application, will be utilized. 

- in case of `OrderStateChanged` and order state being set to `Cancelled`, if the shipping address country is not US or Canada, or if the disable document recording setting is activated, nothing will happen and a status 200 response will be returned. Otherwise, a void transaction call with a corresponding order number will be made to AvaTax service. If a `CannotModifyLockedTransaction` error is raised by AvaTax service, which happens always when a transaction has been already filed for returns, then a refund transaction call will be made.
- Any kind of AvaTax Service calls and possible errors will be logged exactly as described in the service application, and will return status 200. Any error outside of this scope, e.g. no AvaTax credentials were specified in the merchant center, will return status 400. 

# mc-app

- this application provides a configuration window for the AvaTax service used within service and event applications. A merchant-specific data about configuration of this app can be found [here](https://projects.mediaopt.de/projects/mopt-ecomqe/wiki/User_manual). 

- Merchant AvaTax service configuration properties and origin address data are saved as properties of a custom object with container `avalara-connector-settings`. Those are fetched by the mc-app when it loads and are saved/updated upon clicking `save data` button. 

- mc-app utilizes 2 endpoints of the service application as described above in the service application, `/test-connection` and `/check-address`. The corresponding extension base url is fetched from the commercetools composable API. 