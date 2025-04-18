const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'USER' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const { data: existingUser, error: checkEmailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (checkEmailError) {
      console.error('Erreur lors de la vérification de l\'email:', checkEmailError.message);
      return res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
    }

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // On force la casse MAJUSCULE sur le rôle
    const roleToFind = role.toUpperCase();
    console.log('Rôle recherché:', roleToFind);

    // Récupération du rôle
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleToFind);

    console.log('Résultat de la requête pour les rôles:', roleData);

    if (roleError || !roleData || roleData.length === 0) {
      console.error('Erreur lors de la récupération du role_id:', roleError ? roleError.message : 'Rôle non trouvé');
      return res.status(500).json({ error: 'Erreur lors de la récupération du rôle' });
    }

    // Utilisez roleData[0].id pour accéder à l'ID du rôle
    const roleId = roleData[0].id;

    // Hash du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertion du nouvel utilisateur
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role_id: roleId }])
      .select();

    if (insertError) {
      console.error('Erreur lors de l\'inscription:', insertError.message);
      return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Récupération de l'utilisateur et de ses permissions, ajouté can_post_products plus tard en dessous de  can_get_users
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          can_post_login,
          can_get_my_user,
          can_get_users,
          can_post_products
        )
      `)
      .eq('email', email)
      .single();

    console.log('Utilisateur trouvé:', user);
    console.log('Erreur Supabase:', error);

    if (error || !user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Mot de passe valide:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        roleId: user.role_id,
        permissions: {
          can_get_my_user: user.roles.can_get_my_user,
          can_get_users: user.roles.can_get_users,
          can_post_products: user.roles.can_post_products
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

module.exports = router;
