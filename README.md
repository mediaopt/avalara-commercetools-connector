<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a></br>
  <a href="https://www.avalara.com/us/en/products/sales-and-use-tax.html">
    <img alt="avalara logo" src="https://www.avalara.com/etc.clientlibs/avalara/clientlibs/avalara/resources/images/corporate_home_2_u15612.svg">
  </a><br>
</p>

# Avalara Commercetools Connector

**Automated sales tax calculation and compliance for US & Canada** 🇺🇸 🇨🇦

A certified [Commercetools Connect](https://marketplace.commercetools.com/) application that seamlessly integrates Avalara AvaTax into your e-commerce platform for real-time tax calculation, document recording, and compliance management.

[![Avalara Certified](https://img.shields.io/badge/Avalara-Certified-blue)](https://www.avalara.com/partner/en/partners/avatax-certification-badges.html)
![Sales Tax Badge](https://img.shields.io/badge/Badge-Sales%20Tax-green)
![Address Validation Badge](https://img.shields.io/badge/Badge-Address%20Validation-green)

---

## ✨ Key Features

### 🧮 **Automated Tax Calculation**
- Real-time tax calculation on cart creation/update
- Supports line items, custom line items, and shipping
- Handles mixed taxable/non-taxable amounts
- Prevents duplicate calculations with intelligent cart hashing

### 📋 **Transaction Management**
- **Commit** transactions when orders are created
- **Void** transactions for cancelled orders (pre-filing)
- **Refund** transactions for cancelled filed orders
- Automatic status handling based on filing state

### 🎯 **Flexible Tax Configuration**
- Product-level tax codes via custom attributes
- Category-level tax codes
- Shipping method tax codes
- Customer entity use codes for tax exemptions
- Optional Avalara backoffice item code mapping

### 🏢 **Merchant Center Integration**
- Easy-to-use configuration UI (mc-app)
- Test Avalara credentials before going live
- Origin address validation
- Configurable tax calculation and reporting profiles
- All settings stored in custom objects

### 🔐 **Address Validation**
- Validate addresses via AvaTax service
- Available for origin address and shipping addresses
- Frontend integration support with JWT authorization
- Automatic address suggestions for incomplete addresses

### 📊 **Comprehensive Logging**
- Integrated AvaTax SDK logging
- Request/response tracking
- Available via connector deployment logs
- Configurable logging levels

---

## 🏗️ Architecture

The connector consists of three applications:

| Component | Purpose | Key Functions |
|-----------|---------|---------------|
| **🎨 mc-app** | Configuration UI | Credential validation, address validation, settings management |
| **⚡ service** | Real-time tax calculation | Cart tax calculation, address validation endpoint, connection testing |
| **📬 event** | Transaction recording | Order commits, cancellation handling, void/refund transactions |

---

## 🚀 Quick Start

### Prerequisites

- ✅ Avalara account ([Sandbox](https://sandbox.admin.avalara.com/) or [Production](https://identity.avalara.com/))
- ✅ Commercetools Merchant Center account
- ✅ Admin API Client with required scopes

### Installation Overview

1. **Create API Client** in Commercetools (Admin scope)
2. **Create Custom Application** in Merchant Center with unique entry point URI
3. **Deploy Connector** using commercetools connect deployment
4. **Configure Settings** in the mc-app UI
5. **Test & Go Live** 🎉

> 📖 **Detailed installation guide:** See [Installation Guide](docs/connector_installation_guide.md)

---

## 🔧 Configuration

### Environment Variables

**Service & Event (Secured):**
```bash
AVALARA_USERNAME=<account-number>
AVALARA_PASSWORD=<license-key>
AVALARA_COMPANY_CODE=<company-code>
AVALARA_ENV=sandbox|production
COMMERCE_TOOLS_PROJECT_KEY=<project-key>
COMMERCE_TOOLS_ID=<client-id>
COMMERCE_TOOLS_SECRET=<client-secret>
```

**Service (Optional):**
```bash
FRONTEND_API_KEY=<jwt-secret>  # For address validation endpoint
AVATAX_PRODUCT_ATTRIBUTE_NAME=avatax-code  # Custom product attribute name
```

**Custom Type Configuration:**
Customize type keys/names for seamless multi-connector integration:
- `CATEGORY_CUSTOM_TYPE_KEY` / `CATEGORY_CUSTOM_TYPE_NAME`
- `SHIPPING_METHOD_CUSTOM_TYPE_KEY` / `SHIPPING_METHOD_CUSTOM_TYPE_NAME`
- `CUSTOMER_CUSTOM_TYPE_KEY` / `CUSTOMER_CUSTOM_TYPE_NAME`
- `ORDER_CUSTOM_TYPE_KEY` / `ORDER_CUSTOM_TYPE_NAME`
- `CUSTOM_LINE_ITEM_CUSTOM_TYPE_KEY` / `CUSTOM_LINE_ITEM_CUSTOM_TYPE_NAME`

---

## 📡 API Endpoints

### `/service` (Main Extension)
Handles cart tax calculation automatically via Commercetools extensions.

### `/service/test-connection` 🔌
Test Avalara credentials and service availability.

### `/service/check-address` 📍
Validate addresses with AvaTax service. Supports:
- Origin address validation (mc-app)
- Frontend shipping address validation (with JWT auth)

**Request:**
```json
{
  "address": {
    "line1": "123 Main St",
    "city": "Seattle",
    "region": "WA",
    "postalCode": "98101",
    "country": "US"
  }
}
```

---

## 🎯 Use Cases

✅ **E-commerce stores** selling in US/Canada  
✅ **Multi-state merchants** with complex tax requirements  
✅ **Subscription services** with recurring billing  
✅ **B2B platforms** with tax exemptions  
✅ **Marketplace platforms** with multiple sellers  

---

## 🔐 Security & Compliance

- 🔒 Credentials stored securely in connector configuration
- 🛡️ JWT-based frontend authorization
- ✅ Avalara certified for Sales Tax & Address Validation
- 📋 Automatic document recording for compliance
- 🔍 Full audit trail via logging

---

## 📚 Documentation

- 📖 [Technical Documentation](docs/README.md) - Architecture and API details
- 🎓 [Installation Guide](docs/connector_installation_guide.md) - Step-by-step setup
- 📱 [Frontend Integration](https://github.com/mediaopt/avalara-commercetools-cofe-integration) - Address validation in your storefront
- 📊 [Architecture Diagram](docs/architecture.pdf) - Visual overview
- 🎨 [MC App Manual](docs/mc_app_configuration_manual.pdf) - Configuration UI guide

---

## 🛠️ Development

### Local Setup

```bash
# Install dependencies
cd service && yarn install
cd event && yarn install

# Configure environment
cp .env.example .env  # Add your credentials

# Start development servers
yarn start:dev
```

### Testing

```bash
# Run unit tests
yarn test
```

---

## 🤝 Support

- 📧 **Technical Support:** support@mediaopt.de
- 🔗 **Avalara Support:** Contact your Avalara advisor
- 🐛 **Issues:** [GitHub Issues](https://github.com/mediaopt/avalara-commercetools-connector/issues)

---

## 📜 License

See [LICENSE](LICENSE) file for details.

---

## 🏆 Certification

This connector is certified by Avalara for:
- ✅ Sales Tax Calculation
- ✅ Address Validation

Ensuring compliance with Avalara's best practices and standards.
