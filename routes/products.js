const express = require('express');
const axios = require('axios');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Créer un produit dans Shopify et l'enregistrer dans Supabase
router.post('/', authenticate, authorize('can_post_products'), async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Nom et prix du produit requis' });
    }

    // Appel à l'API Shopify pour créer un produit
    const shopifyResponse = await axios({
        method: 'post',
        url: `https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-10/products.json`,
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
        },
        data: {
            product: {
                title: name,
                variants: [{ price }]
            }
        }
    });

    const shopifyProduct = shopifyResponse.data.product;

    // Enregistrer le produit dans Supabase
    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          shopify_id: shopifyProduct.id,
          created_by: req.user.userId,
          sales_count: 0
        }
      ])
      .select();

    if (error) {
      console.error('Erreur lors de l\'enregistrement du produit dans Supabase:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'enregistrement du produit' });
    }

    res.status(201).json({ message: 'Produit créé avec succès', product });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// Récupérer les produits créés par l'utilisateur connecté
router.get('/my-products', authenticate, async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('created_by', req.user.userId);

    if (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }

    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

// Récupérer tous les produits
router.get('/', authenticate, authorize('can_get_users'), async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        shopify_id,
        created_by,
        sales_count,
        users (name, email)
      `);

    if (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }

    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

module.exports = router;