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
```

### 2. Configure Environment Variables

Execute `cp .env.example .env` in your application directory and add your credentials:

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

# Extension URL (will be updated after ngrok starts), only for service
CONNECT_SERVICE_URL=https://your-ngrok-url.ngrok.io
# Subscription topic and project id from your GCP, only for event
CONNECT_GCP_TOPIC_NAME_KEY='CONNECT_GCP_TOPIC_NAME'
CONNECT_GCP_PROJECT_ID_KEY='CONNECT_GCP_PROJECT_ID'
```

### 3. Start Ngrok Tunnel

Expose your local server (port 8080) to the internet using ngrok:

```bash
# Option 1: Use the provided script
./dev/scripts/ngrok.sh

# Option 2: Run ngrok directly
ngrok http 8080
```

#### Service

Copy the generated ngrok URL (e.g., `https://abc123.ngrok.io`) and update the `CONNECT_SERVICE_URL` with path `/service` in your `.env` file

#### Event
Create a push subscription in your GCP topic and add the generated ngrok URL with path `/event` as its endpoint url. 

### 4. Register Applications

Register the Commercetools extension or subscription:

```bash
yarn connector:post-deploy
```

This will create/update the extension or subscription configuration in Commercetools to point to your local development server.

### 5. Start Development Server

Start the application in development mode with hot-reload:

```bash
yarn start:dev
```

Your local development environment is now ready! 🎉

---

## Troubleshooting

### Ngrok URL Changes

If you restart ngrok, you'll get a new URL. Remember to:
1. Update `CONNECT_SERVICE_URL` in `.env` if you are working with `/service`.
2. Update the endpoint url in your push subscription if you are working with `/event`.
2. Re-run `yarn connector:post-deploy`

### Extension Not Triggering

- Verify the ngrok tunnel is active
- Check that the extension URL in Commercetools matches your ngrok URL
- Review logs for any connection errors

### Environment Variables

- Ensure all required credentials are set in `.env`
- Double-check there are no typos in credential values
- Verify your API client has the required scopes

---

## Next Steps

- 📖 Review the [Technical Documentation](../../docs/README.md)
- 🧪 Run tests with `yarn test`
- 🔍 Check logs for debugging information
- 🚀 Make your changes and test locally before deployment
