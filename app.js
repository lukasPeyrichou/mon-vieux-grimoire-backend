// Application Express : middlewares globaux et branchement des routes
const express = require('express');
const mongoose = require('mongoose');

// Connexion à la base MongoDB (l'adresse, qui contient le mot de passe, reste dans .env)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.error('Connexion à MongoDB échouée :', error.message));

const app = express();

// Transforme le corps des requêtes JSON en objet JavaScript (req.body)
app.use(express.json());

// CORS : autorise le front (localhost:3000) à appeler l'API (localhost:4000)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Route temporaire de l'étape 1.1 pour vérifier que le serveur répond
app.use((req, res) => {
  res.json({ message: 'Votre requête a bien été reçue !' });
});

module.exports = app;
