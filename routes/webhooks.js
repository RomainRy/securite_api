const express = require('express');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const router = express.Router();

// Vérifier la signature HMAC du webhook
const verifyShopifyWebhook = (req, res, next) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const body = JSON.stringify(req.body);

    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64');

    if (generatedHmac !== hmacHeader) {
      return res.status(401).json({ error: 'Signature HMAC invalide' });
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification HMAC:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification HMAC' });
  }
};

// Endpoint pour gérer les webhooks Shopify
router.post('/shopify-sales', express.json(), verifyShopifyWebhook, async (req, res) => {
  try {
    const { line_items } = req.body;

    if (!line_items || line_items.length === 0) {
      return res.status(400).json({ error: 'Aucun produit dans la commande' });
    }

    // Parcourir les produits de la commande
    for (const item of line_items) {
      const shopifyProductId = item.product_id;
      const quantity = item.quantity;

      // Mettre à jour le sales_count dans Supabase
      const { data, error } = await supabase
        .from('products')
        .update({ sales_count: supabase.raw('sales_count + ?', [quantity]) })
        .eq('shopify_id', shopifyProductId);

      if (error) {
        console.error(`Erreur lors de la mise à jour du produit ${shopifyProductId}:`, error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour des produits' });
      }
    }

    res.status(200).json({ message: 'Webhook traité avec succès' });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook' });
  }
});

module.exports = router;