const { Shopify, ApiVersion } = require('@shopify/shopify-api');

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: ['read_products', 'write_products'],
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ''),
  API_VERSION: ApiVersion.October23,
  IS_EMBEDDED_APP: false,
});

module.exports = Shopify;