// middleware/auth.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware d'autorisation basé sur les permissions
const authorize = (permission) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur a la permission requise
    if (!req.user || !req.user.permissions[permission]) {
      return res.status(403).json({ error: 'Permission refusée' });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };