const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Récupérer les informations de l'utilisateur connecté
router.get('/my-user', authenticate, authorize('can_get_my_user'), async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role_id,
        roles (
          name,
          can_post_login,
          can_get_my_user,
          can_get_users
          
        )
      `)
      .eq('id', req.user.userId)
      .single();
      
    if (error || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Ne pas renvoyer le hash du mot de passe
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

// Récupérer la liste de tous les utilisateurs (admin seulement)
router.get('/', authenticate, authorize('can_get_users'), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role_id,
        roles (name)
      `);
      
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
    
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

module.exports = router;