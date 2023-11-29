<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a></br>
  <a href="https://www.avalara.com/us/en/products/sales-and-use-tax.html">
    <img alt="avalara logo" src="https://www.avalara.com/etc.clientlibs/avalara/clientlibs/avalara/resources/images/corporate_home_2_u15612.svg">
  </a><br>
</p>

This is a [connect application](https://marketplace.commercetools.com/) to integrate Avalara Tax calculation and Reports services into Commercetools.
It follows the folder structure to ensure certification & deployment from commercetools connect team as stated [here](https://github.com/commercetools/connect-application-kit#readme).

## Instructions

* `cd avalara-commercetools-connector/service` or `cd avalara-commercetools-connector/event`
* run `yarn` to install the dependencies 
* insert commercetools credentials to `.env` file
* run `./bin/ngrok.sh` or `ngrok http 8080` to start ngrok and insert the dynamic url in the `.env` file as specified in post-deploy script
* run `yarn connector:post-deploy` to register the extension with the public ngrok url
* run `ỳarn start:dev` to build the application

## Architecture principles for building an connect application 

* Connector solution should be lightweight in nature
* Connector solutions should follow test driven development. Unit , Integration (& E2E) tests should be included and successfully passed to be used
* No hardcoding of customer related config. If needed, values in an environment file which should not be maintained in repository
* Connector solution should be supported with detailed documentation
* Connectors should be point to point in nature, currently doesnt support any persistence capabilities apart from in memory persistence
* Connector solution should use open source technologies, although connector itself can be private for specific customer(s)
* Code should not contain console.log statements, use [the included logger](https://github.com/commercetools/merchant-center-application-kit/tree/main/packages-backend/loggers#readme) instead.
