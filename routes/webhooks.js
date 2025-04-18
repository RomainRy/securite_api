const express = require('express');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const router = express.Router();

// 👇 Middleware uniquement pour cette route (à ne pas globaliser !)
const rawBodyMiddleware = express.raw({ type: 'application/json' });

// Vérification HMAC
const verifyShopifyWebhook = (req, res, next) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];

    if (!hmacHeader || !req.body) {
      return res.status(400).json({ error: 'Header HMAC ou body manquant' });
    }

    // req.body doit être un Buffer
    if (!(req.body instanceof Buffer)) {
      return res.status(400).json({ error: 'Le corps de la requête n’est pas un Buffer' });
    }

    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(req.body)
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

// Traitement du webhook
router.post(
  '/shopify-sales',
  rawBodyMiddleware, 
  verifyShopifyWebhook,
  async (req, res) => {
    try {
      const data = JSON.parse(req.body.toString('utf8'));
      const lineItems = data.line_items;

      if (!lineItems || lineItems.length === 0) {
        return res.status(400).json({ error: 'Aucun produit dans la commande' });
      }

      for (const item of lineItems) {
        const shopifyProductId = item.product_id;
        const quantity = item.quantity;
      
        const { error } = await supabase.rpc('increment_sales', {
          p_shopify_id: shopifyProductId, 
          p_increment: quantity
        });
      
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
  }
);

module.exports = router;
