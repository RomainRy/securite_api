const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Créer une application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

const webhooksRouter = require('./routes/webhooks');
app.use('/webhooks', webhooksRouter);


app.use(express.json());

// Importer le fichier de routes
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const productsRouter = require('./routes/products');
// const webhooksRouter = require('./routes/webhooks');

// Route de santé
app.get('/health', (req, res) => {
  res.json({ test: "hello world" });
});

// Utiliser les routes du fichier auth.js
app.use('/', authRouter); 
app.use('/users', userRouter); 
app.use('/products', productsRouter);
// app.use('/webhooks', webhooksRouter);


// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
