# Avalara Tax Compliance Software

## About & Scope
Avalara, Inc is a leading provider of cloud-based software that delivers a broad array of compliance soulutions related to sales tax and other transactional taxes. The Avalara Commercetools Connector calculates automatically the final sales tax amount on every invoice and helps clients to manage complicated tax regulations, especially for such countries like USA and Canada, which are known for their unclear tax systems. 

The software consists of three applications: mc-app, which serves just as a configuration window for the connector, service, which fetches and updates Avalara tax calculation results for commercetools carts, and event, which commits new orders to Avalara, voids unreported cancelled orders, and refunds already reported cancelled orders. All together they provide an automated seamless tax calculation and reporting experience and can be easily integrated into your frontend. The connector has been certified by Avalara for the following [Badges](https://www.avalara.com/partner/en/partners/avatax-certification-badges.html): Sales Tax and Address Validation, so that Avalara Tax Compliance is assured.

1. Your AvaTax Account connected to your shop 

Commercetools custom application (mc-app) provides a configuration window for validating your Avalara credentials and your origin address, as well as your tax calculation and reporting profile. The data (apart from the credentials) is saved into a single commercetools custom object 'avalara-connector-settings', which is called and utilized for the targeted checkout tax calculation and after-sales document recording.

2. Category and Shipping Method Tax codes, Customer Entity Use codes

The Software automatically creates category, shipping method and customer custom fields upon connector installation. These custom fields can be utilized by the merchant for configuring correct Avalara tax codes and customer entity use codes for a compliant tax calculation. Avalara also provides an option of loading a mapping list of item codes to tax codes directly to the Avalara Backoffice, so the usage of the above custom fields is optional. 

3. Checkout Tax Calculation 

On each creation or update of a commercetools cart, a validation process will be triggered, and if a cart is eligible for a (new) tax calculation, an Avalara tax calculation quotes will be applied
to the cart via several update actions. The result can be then utilized in your frontend application via accessing `taxedPrice` properties of the cart. 

4. Commit transaction to Avalara Backoffice

If a cart converts to an order, an automatic commit call will be made to the Avalara services, which records an order transaction into your Avalara Backoffice, including all relevant information about line items, prices, shipping, tax codes, and customer. This transaction can be identified via a corresponding commercetools order number. 

5. Void/Refund transaction 

If an order status is changed to 'Cancelled', an automatic void call to Avalara services is triggered for a corresponding order. If a cancelled order transaction has not been filed for returns yet, it will just change its status from 'commited' to 'voided'. However, if a transaction has already been filed for returns, it will be locked for any further modification, so that a refund call must be made instead, which is also taken care of by the connector. 

Learn more about connector configurations [here](https://projects.mediaopt.de/projects/mopt-ecomqe/wiki).

## Prerequisite
1. Avalara Backoffice Account ([Sandbox](https://sandbox.admin.avalara.com/) and/or [Production](https://identity.avalara.com/))
2. Commercetools Merchant center account
## How to Install
1. Make sure that you have a working access to a sandbox and a production instance of Avalara Backoffice by consulting Avalara.
Your credentials data that you need for a successful deployment is as follows: 
    - AVALARA_USERNAME (your Avalara account number)
    - AVALARA_PASSWORD (your Avalara license key)
    - AVALARA_COMPANY_CODE (your Avalara company code)
    - AVALARA_ENV (your Avalara environment, which is either 'sandbox' or 'production')
2. To deploy and to use a commercetools connector, you need a dedicated API Client. You can create it in
Settings > Developer Settings > Create new API client (top right corner) using the Admin client
scope template. You will need: 
    - COMMERCE_TOOLS_PROJECT_KEY
    - COMMERCE_TOOLS_ID
    - COMMERCE_TOOLS_SECRET
    - COMMERCE_TOOLS_SCOPE
    - COMMERCE_TOOLS_REGION

    Save these as they are required for a deployment later.

3. Follow this [guide](https://docs.commercetools.com/merchant-center/managing-custom-applications) on creating a custom application in your merchant center. For the time being you can enter some dummy url for an application url. Choose carefully your application entry point URI path, since it should be unique for each commercetools region. We recommend something like `avalara-YOUR_COMPANY_NAME`. View permissions must be view key-value documents, and manage permissions must be manage key-value documents, manage extensions. A submenu should also be configured. Here you should put `settings` into the field 'Link to'. Everything else can be configured to your liking. After saving the custom application, make sure to copy a newly generated `application id` and also your `entry point URI path`.
4. Deploy the connector. According to the connector deployment schema, to this end you will need the credentials from the step 2 and the Avalara credentials as the secured configuration for both service and event. For the service application you might also need a frontend api key (`FRONTEND_API_KEY`) to authorize your frontend application to use the `check-address` endpoint, but this is not obligatory. However, if you want to use it, this frontend api key must also be utilized in your frontend application, as described [here](https://github.com/mediaopt/avalara-commercetools-cofe-integration). Apart from that you will need an extension of your service standard configuration: keys and names for the connector custom types that can be configured by you for [seamless integration](https://docs.commercetools.com/tutorials/composable-custom-types) with other connectors. Here is the list of the variables you will need to specify (or default values will be used instead):
    - CATEGORY_CUSTOM_TYPE_KEY
    - CATEGORY_CUSTOM_TYPE_NAME
    - SHIPPING_METHOD_CUSTOM_TYPE_KEY
    - SHIPPING_METHOD_CUSTOM_TYPE_NAME
    - CUSTOMER_CUSTOM_TYPE_KEY
    - CUSTOMER_CUSTOM_TYPE_NAME
    - ORDER_CUSTOM_TYPE_KEY
    - ORDER_CUSTOM_TYPE_NAME
    
For your mc-app (custom application), you will need to specify a `CUSTOM_APPLICATION_ID` and `ENTRY_POINT_URI_PATH` from the step 3 for the mc-app standard configuration.
5. Copy your deployed mc-app application url to the configuration page of a corresponding custom application, install it to desired projects and put its state to ready. The app should become visible in your merchant center.
6. Now all connector functionalities should be available to you. Configure your Avalara setting in the custom application and feel free to explore the connector functionalities. Make sure you test all features with a sandbox Avalara account before going live. 

For more information, extensive documentation and details, please have a look at this [page](https://projects.mediaopt.de/projects/mopt-ecomqe/wiki). The important manuals are especially the [Avalara user manual](https://projects.mediaopt.de/projects/mopt-ecomqe/wiki/Avalara_user_manual), the [commercetools documentation](https://projects.mediaopt.de/projects/mopt-ecomqe/wiki/Commercetools_documentation) and the [frontend integration guide](https://projects.mediaopt.de/projects/mopt-ecomqe/wiki/Frontend_integration).

Note: the connector repository is at present **private**. If you wish to see the repository, please contact our support team, and we will grant you access to it.

Support E-Mail Address: support@mediaopt.de 

For all questions concerning your Avalara account, please contact your Avalara advisor. 
