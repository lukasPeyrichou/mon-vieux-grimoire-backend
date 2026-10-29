// Application Express : middlewares globaux et branchement des routes
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');

const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');

// Neutralise les opérateurs MongoDB ($ne, $gt...) glissés dans les données reçues :
// sans ça, { "email": { "$ne": null } } au login trouverait le premier utilisateur venu
mongoose.set('sanitizeFilter', true);

// Connexion à la base MongoDB (l'adresse, qui contient le mot de passe, reste dans .env)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.error('Connexion à MongoDB échouée :', error.message));

const app = express();

// En-têtes HTTP de sécurité. crossOriginResourcePolicy est assoupli pour que le front,
// servi sur un autre port (3000), puisse afficher les images de l'API (4000)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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

// Rend les images enregistrées accessibles à l'adresse http://localhost:4000/images/<fichier>
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

module.exports = app;
