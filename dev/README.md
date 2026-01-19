# Local Development Guide

This guide walks you through setting up the Avalara Commercetools Connector for local development.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js and Yarn installed
- ✅ Commercetools project credentials
- ✅ Avalara account credentials
- ✅ Ngrok installed ([download here](https://ngrok.com/download))
- ✅ Access to an existing GCP Project 

### Internal

For Mediaopt Colleagues: ensure that you have a commercetools account that has an access to the avalara-demo project in our organization, or else ask your administrator. Avalara sandbox credentials can be found in our password manager. Ask your administrator to add you to our organization in GCP, if you do not have access. Use the motomate project within this organization. 

---

## Setup Instructions

### 1. Install Dependencies

Choose the application you want to work on and install dependencies:

```bash
# For service application
cd avalara-commercetools-connector/service
yarn install

# OR for event application
cd avalara-commercetools-connector/event
yarn install

# OR for mc-app (Merchant Center Custom Application)
cd avalara-commercetools-connector/mc-app
yarn install
```

### 2. Configure Environment Variables

Execute `cp .env.example .env` in your application directory and add your credentials:

#### For Service Application

```bash
# Commercetools Configuration
CTP_CLIENT_ID=your-api-client-client-id
CTP_CLIENT_SECRET=your-api-client-secret
CTP_PROJECT_KEY=your-project-key
CTP_SCOPE=your-api-client-scope
CTP_REGION=your-region

# Avalara Configuration
AVALARA_USERNAME=your-account-number
AVALARA_PASSWORD=your-license-key
AVALARA_COMPANY_CODE=your-company-code
AVALARA_ENV=sandbox

# Extension URL (will be updated after ngrok starts)
CONNECT_SERVICE_URL=https://your-ngrok-url.ngrok.io
```

#### For Event Application

```bash
# Commercetools Configuration
CTP_CLIENT_ID=your-api-client-client-id
CTP_CLIENT_SECRET=your-api-client-secret
CTP_PROJECT_KEY=your-project-key
CTP_SCOPE=your-api-client-scope
CTP_REGION=your-region

# Avalara Configuration
AVALARA_USERNAME=your-account-number
AVALARA_PASSWORD=your-license-key
AVALARA_COMPANY_CODE=your-company-code
AVALARA_ENV=sandbox

# Subscription topic and project id from your GCP
CONNECT_GCP_TOPIC_NAME='CONNECT_GCP_TOPIC_NAME'
CONNECT_GCP_PROJECT_ID='CONNECT_GCP_PROJECT_ID'
```

#### For MC-App (Merchant Center Application)

```bash
ENABLE_NEW_JSX_TRANSFORM="true"
FAST_REFRESH="true"
CLOUD_IDENTIFIER="gcp-eu"  # or gcp-us, aws-us, etc.

# Custom Application Configuration
CUSTOM_APPLICATION_ID=<your-custom-app-id-from-merchant-center>
APPLICATION_URL="http://localhost:3001"  # Local development URL
ENTRY_POINT_URI_PATH="avalara-connector"  # Must match your MC config
```

**Note:** For mc-app, the `CUSTOM_APPLICATION_ID` is obtained from the Merchant Center when you create a Custom Application under Settings → Developer Settings → Custom Applications.

### 3. Start Ngrok Tunnel (Service/Event Only)

Expose your local server (port 8080) to the internet using ngrok:

```bash
# Option 1: Use the provided script
./bin/ngrok.sh

# Option 2: Run ngrok directly
ngrok http 8080
```

#### Service

Copy the generated ngrok URL (e.g., `https://abc123.ngrok.io`) and update the `CONNECT_SERVICE_URL` with path `/service` in your `.env` file

#### Event
Create a push subscription in your GCP topic and add the generated ngrok URL with path `/event` as its endpoint url. 

**Note:** The mc-app runs on port 3001 and doesn't require ngrok for local development.

### 4. Register Applications (Service/Event Only)

Register the Commercetools extension or subscription:

```bash
yarn connector:post-deploy
```

This will create/update the extension or subscription configuration in Commercetools to point to your local development server.

### 5. Start Development Server

Start the application in development mode with hot-reload:

#### Service/Event Applications

```bash
yarn start:dev
```

#### MC-App (Merchant Center Application)

```bash
# Compile to js
yarn build

# Start the development server
yarn start
```

This will start the mc-app on `http://localhost:3001`. The application uses the Merchant Center local development proxy to authenticate with your Commercetools project.

**Access the application:**
1. Navigate to `http://localhost:3001/<your-project-key>/<entry-point-uri-path>`
2. Example: `http://localhost:3001/avalara-demo/avalara-connector`
3. You'll be redirected to login with your Commercetools credentials

Your local development environment is now ready! 🎉

---

## Troubleshooting

### Service/Event Applications

#### Ngrok URL Changes

If you restart ngrok, you'll get a new URL. Remember to:
1. Update `CONNECT_SERVICE_URL` in `.env` if you are working with `/service`.
2. Update the endpoint url in your push subscription if you are working with `/event`.
3. Re-run `yarn connector:post-deploy`

#### Extension Not Triggering

- Verify the ngrok tunnel is active
- Check that the extension URL in Commercetools matches your ngrok URL
- Review logs for any connection errors

### MC-App Application

#### Application Not Loading

- Ensure the Custom Application is registered in Merchant Center
- Verify `CUSTOM_APPLICATION_ID` matches the ID in Merchant Center
- Check that `ENTRY_POINT_URI_PATH` matches the configured value
- Make sure you're accessing the correct URL: `http://localhost:3001/<project-key>/<entry-point>`

#### Authentication Issues

- Confirm you have access to the Commercetools project
- Verify your user has the required permissions (`view_key_value_documents`, `manage_key_value_documents`)
- Clear browser cache and cookies if login fails

#### CORS Errors

- The mc-app config already includes `"connect-src": ["*"]` in CSP headers
- If issues persist, check browser console for specific blocked origins

### General Issues

#### Environment Variables

- Ensure all required credentials are set in `.env`
- Double-check there are no typos in credential values
- Verify your API client has the required scopes

#### Port Conflicts

- Service/Event: Default port is **8080**
- MC-App: Default port is **3001**
- Change ports in the respective configurations if conflicts occur

---

## Next Steps

- 📖 Review the [Technical Documentation](../docs/README.md)
- 🧪 Run tests with `yarn test`
- 🔍 Check logs for debugging information
- 🚀 Make your changes and test locally before deployment

### Application-Specific Resources

**Service/Event:**
- [Commercetools Extensions](https://docs.commercetools.com/api/projects/api-extensions)
- [Commercetools Subscriptions](https://docs.commercetools.com/api/projects/subscriptions)

**MC-App:**
- [Custom Applications Development](https://docs.commercetools.com/custom-applications/development)
- [Custom Applications Deployment](https://docs.commercetools.com/custom-applications/deployment-examples)
- [MC Scripts CLI](https://docs.commercetools.com/custom-applications/api-reference/cli)
